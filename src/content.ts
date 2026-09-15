import {
  createAnalyzerPanel,
  renderJobAnalysis,
  renderLoading,
  renderError,
  showAnalyzerPanel,
  hideAnalyzerPanel,
  isPanelOpen,
} from "./ui";

import type { JobSummary } from "./ui";

console.log("LinkedIn Job Analyzer loaded");

let lastJobDescription: string | null = null;
let analysisInProgress = false;

let currentJobWatcherRunning = false;
let navigationWatcherRunning = false;

/**
 * Check whether we are currently inside LinkedIn Jobs.
 */
function isJobsPage(): boolean {
  return window.location.pathname.startsWith("/jobs");
}

/**
 * Get the currently selected LinkedIn job ID.
 *
 * LinkedIn search results:
 * /jobs/search-results/?currentJobId=123456789
 *
 * Direct job URL:
 * /jobs/view/123456789/
 */
function getCurrentJobId(): string | null {
  const url = new URL(window.location.href);

  // LinkedIn search results
  const currentJobId = url.searchParams.get("currentJobId");

  if (currentJobId) {
    return currentJobId;
  }

  // LinkedIn direct job URL
  const match = window.location.pathname.match(
    /\/jobs\/view\/(\d+)/
  );

  return match?.[1] ?? null;
}

/**
 * Extract the job description from LinkedIn.
 */
function getJobDescription(): string | null {
  const element = document.querySelector(
    '[data-testid="expandable-text-box"]'
  );

  if (!element) {
    return null;
  }

  // Clone so we don't modify LinkedIn's actual DOM.
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove "... more" button.
  const moreButton = clone.querySelector(
    '[data-testid="expandable-text-button"]'
  );

  moreButton?.remove();

  const description =
    clone.textContent?.trim() ?? "";

  return description || null;
}

/**
 * Extract company name from LinkedIn.
 */
function extractCompanyName(): string | null {
  const companyLink =
    document.querySelector<HTMLAnchorElement>(
      'a[href*="/company/"]'
    );

  return (
    companyLink?.textContent?.trim() || null
  );
}

/**
 * Extract profile name from LinkedIn.
 *
 * This currently looks for an /in/ profile link.
 */
function extractProfileName(): string | null {
  const profileLinks =
    document.querySelectorAll<HTMLAnchorElement>(
      'a[href*="/in/"]'
    );

  for (const link of profileLinks) {
    const name = link.textContent?.trim();

    if (name) {
      return name;
    }
  }

  return null;
}

/**
 * Wait until the JD for the expected job is available.
 */
function waitForJobDescription(
  expectedJobId: string
): Promise<string> {
  return new Promise((resolve) => {
    let resolved = false;

    const observer = new MutationObserver(() => {
      check();
    });

    const check = () => {
      if (resolved) {
        return;
      }

      if (!isJobsPage()) {
        return;
      }

      const currentJobId =
        getCurrentJobId();

      // Ignore DOM changes belonging to another job.
      if (currentJobId !== expectedJobId) {
        return;
      }

      const description =
        getJobDescription();

      if (!description) {
        return;
      }

      // Prevent accidentally analyzing
      // the previous job's JD.
      if (
        lastJobDescription &&
        description === lastJobDescription
      ) {
        return;
      }

      resolved = true;

      observer.disconnect();

      resolve(description);
    };

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Check immediately as well.
    check();
  });
}

/**
 * Send JD + metadata to background.ts.
 */
async function requestJobAnalysis(
  jobDescription: string,
  companyName: string | null,
  profileName: string | null
): Promise<JobSummary> {
  console.log(
    "CONTENT: sending job to background..."
  );

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "ANALYZE_JOB",
        jobDescription,
        companyName,
        profileName,
      },
      (response) => {
        console.log(
          "CONTENT: response from background:",
          response
        );

        if (chrome.runtime.lastError) {
          console.error(
            "CONTENT: runtime error:",
            chrome.runtime.lastError.message
          );

          reject(
            new Error(
              chrome.runtime.lastError.message
            )
          );

          return;
        }

        if (!response?.success) {
          const errorMessage =
            response?.error ??
            "Job analysis failed";

          console.error(
            "CONTENT: background returned error:",
            errorMessage
          );

          reject(
            new Error(errorMessage)
          );

          return;
        }

        console.log(
          "CONTENT: analysis result received:",
          response.data
        );

        resolve(
          response.data as JobSummary
        );
      }
    );
  });
}

/**
 * Process one LinkedIn job.
 */
async function processJob(
  jobId: string
) {
  console.log(
    "Processing job:",
    jobId
  );

  try {
    /**
     * Wait for LinkedIn to render the JD.
     */
    const jobDescription =
      await waitForJobDescription(
        jobId
      );

    /**
     * Make sure user didn't switch jobs
     * while we were waiting.
     */
    if (
      !isJobsPage() ||
      getCurrentJobId() !== jobId
    ) {
      console.log(
        "Job changed while waiting. Ignoring old job."
      );

      return;
    }

    /**
     * Extract LinkedIn metadata.
     */
    const companyName =
      extractCompanyName();

    const profileName =
      extractProfileName();

    console.log(
      "Company Name:",
      companyName
    );

    console.log(
      "Profile Name:",
      profileName
    );

    lastJobDescription =
      jobDescription;

    console.log(
      "Job description found!"
    );

    console.log(
      "Description length:",
      jobDescription.length
    );

    analysisInProgress = true;

    /**
     * Update UI while waiting for AI.
     */
    renderLoading();

    /**
     * Send JD + metadata to background.
     */
    const result =
      await requestJobAnalysis(
        jobDescription,
        companyName,
        profileName
      );

    /**
     * User may have selected another job
     * while the API/Gemini was processing.
     */
    if (
      !isJobsPage() ||
      getCurrentJobId() !== jobId
    ) {
      console.log(
        "Job changed while analysis was running. Ignoring old result."
      );

      return;
    }

    console.log(
      "AI RESULT:",
      result
    );

    /**
     * Make sure company/profile values
     * extracted from LinkedIn are present.
     */
    const finalResult: JobSummary = {
      ...result,
      companyName:
        result.companyName ??
        companyName,

      profileName:
        result.profileName ??
        profileName,
    };

    console.log(
      "FINAL UI RESULT:",
      finalResult
    );

    renderJobAnalysis(
      finalResult
    );

    console.log(
      "UI rendering completed"
    );

  } catch (error) {
    console.error(
      "Analysis error:",
      error
    );

    if (isJobsPage()) {
      renderError(
        error instanceof Error
          ? error.message
          : "Failed to analyze job"
      );
    }

  } finally {
    analysisInProgress = false;
  }
}

/**
 * Watch LinkedIn for job changes.
 *
 * This watcher starts only once.
 */
function watchForJobChanges() {
  if (currentJobWatcherRunning) {
    console.log(
      "Job watcher already running."
    );

    return;
  }

  currentJobWatcherRunning = true;

  let currentJobId =
    getCurrentJobId();

  console.log(
    "Initial Job ID:",
    currentJobId
  );

  /**
   * Process initially selected job.
   */
  if (currentJobId) {
    processJob(currentJobId);
  }

  /**
   * LinkedIn is an SPA.
   *
   * Check for job changes without reload.
   */
  setInterval(() => {
    if (!isJobsPage()) {
      return;
    }

    const newJobId =
      getCurrentJobId();

    if (!newJobId) {
      return;
    }

    if (newJobId === currentJobId) {
      return;
    }

    console.log(
      "Job changed:",
      currentJobId,
      "→",
      newJobId
    );

    currentJobId = newJobId;

    /**
     * Reset previous JD.
     *
     * Important because LinkedIn may initially
     * still contain the previous job's DOM.
     */
    lastJobDescription = null;

    processJob(newJobId);
  }, 500);
}

/**
 * Handle entering/leaving LinkedIn Jobs.
 */
function handlePageChange() {
  if (isJobsPage()) {
    console.log(
      "CONTENT: Entered LinkedIn Jobs"
    );

    /**
     * Start the job watcher.
     */
    watchForJobChanges();

    return;
  }

  console.log(
    "CONTENT: Not on LinkedIn Jobs"
  );

  /**
   * Hide the analyzer when leaving Jobs.
   */
  hideAnalyzerPanel();
}

/**
 * Watch LinkedIn SPA navigation.
 *
 * LinkedIn changes URLs without reloading
 * the entire page.
 */
function watchLinkedInNavigation() {
  if (navigationWatcherRunning) {
    return;
  }

  navigationWatcherRunning = true;

  let lastUrl =
    window.location.href;

  setInterval(() => {
    const currentUrl =
      window.location.href;

    if (currentUrl === lastUrl) {
      return;
    }

    console.log(
      "CONTENT: URL changed:",
      lastUrl,
      "→",
      currentUrl
    );

    lastUrl = currentUrl;

    handlePageChange();
  }, 500);
}

/**
 * Listen for messages from background.ts.
 *
 * This is triggered when the user clicks
 * the Chrome extension icon.
 */
chrome.runtime.onMessage.addListener(
  (message) => {
    console.log(
      "CONTENT: message received:",
      message?.type
    );

    if (
      message?.type !== "TOGGLE_PANEL"
    ) {
      return;
    }

    /**
     * If we're on a Jobs page,
     * toggle the analyzer.
     */
    if (isJobsPage()) {
      if (isPanelOpen()) {
        hideAnalyzerPanel();
      } else {
        showAnalyzerPanel();
      }

      return;
    }

    /**
     * If we're NOT on Jobs,
     * open the panel and show the
     * "Go to LinkedIn Jobs" state.
     */
    showAnalyzerPanel();
  }
);

/**
 * Create the analyzer panel once.
 *
 * It remains hidden until the user clicks
 * the extension icon.
 */
createAnalyzerPanel();

/**
 * Handle the current page immediately.
 */
handlePageChange();

/**
 * Watch for LinkedIn SPA navigation.
 */
watchLinkedInNavigation();