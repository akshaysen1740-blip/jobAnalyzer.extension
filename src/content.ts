import {
  createAnalyzerPanel,
  renderJobAnalysis,
  renderLoading,
  renderError,
} from "./ui";

import type { JobSummary } from "./ui";

console.log("LinkedIn Job Analyzer loaded");

let lastJobId: string | null = null;
let lastJobDescription: string | null = null;
let analysisInProgress = false;

/**
 * Get the currently selected LinkedIn job ID.
 */
function getCurrentJobId(): string | null {
  const url = new URL(window.location.href);

  // LinkedIn search results:
  // /jobs/search-results/?currentJobId=123456789
  const currentJobId = url.searchParams.get("currentJobId");

  if (currentJobId) {
    return currentJobId;
  }

  // LinkedIn direct job URL:
  // /jobs/view/123456789/
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

  const description = clone.textContent?.trim() ?? "";

  return description || null;
}

/**
 * Wait until the JD for the expected job is available.
 */
function waitForJobDescription(
  expectedJobId: string
): Promise<string> {
  return new Promise((resolve) => {
    let resolved = false;

    const check = () => {
      if (resolved) {
        return;
      }

      const currentJobId = getCurrentJobId();

      // Ignore DOM changes belonging to another job.
      if (currentJobId !== expectedJobId) {
        return;
      }

      const description = getJobDescription();

      if (!description) {
        return;
      }

      // Prevent accidentally analyzing the previous job's JD.
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

    const observer = new MutationObserver(() => {
      check();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Check immediately as well.
    check();
  });
}

/**
 * Send the job description to the background service worker.
 *
 * The API itself is NOT called here.
 *
 * content.ts
 *    ↓
 * chrome.runtime.sendMessage()
 *    ↓
 * background.ts
 *    ↓
 * Express API
 */
async function requestJobAnalysis(
  jobDescription: string
): Promise<JobSummary> {
  console.log(
    "CONTENT: sending job to background..."
  );

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "ANALYZE_JOB",
        jobDescription,
      },
      (response) => {
        console.log(
          "CONTENT: response from background:",
          response
        );

        // Chrome runtime error.
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

        // Background returned an error.
        if (!response?.success) {
          const errorMessage =
            response?.error ??
            "Job analysis failed";

          console.error(
            "CONTENT: background returned error:",
            errorMessage
          );

          reject(new Error(errorMessage));

          return;
        }

        console.log(
          "CONTENT: analysis result received:",
          response.data
        );

        resolve(response.data as JobSummary);
      }
    );
  });
}

/**
 * Process one LinkedIn job.
 */
async function processJob(jobId: string) {
  console.log(
    "Processing job:",
    jobId
  );

  if (analysisInProgress) {
    console.log(
      "Previous analysis still running..."
    );
  }

  try {
    /**
     * Wait for LinkedIn to render the JD.
     */
    const jobDescription =
      await waitForJobDescription(jobId);

    /**
     * Make sure the user didn't switch jobs
     * while we were waiting.
     */
    if (getCurrentJobId() !== jobId) {
      console.log(
        "Job changed while waiting. Ignoring old job."
      );

      return;
    }

    lastJobDescription = jobDescription;

    console.log(
      "Job description found!"
    );

    console.log(
      "Description length:",
      jobDescription.length
    );

    console.log(
      "Description:",
      jobDescription
    );

    analysisInProgress = true;

    /**
     * Update UI while waiting for AI.
     */
    renderLoading();

    /**
     * Send JD to background.
     */
    const result = await requestJobAnalysis(
      jobDescription
    );

    /**
     * User may have selected another job
     * while the API/Gemini was processing.
     */
    if (getCurrentJobId() !== jobId) {
      console.log(
        "Job changed while analysis was running. Ignoring old result."
      );

      return;
    }

    console.log(
      "AI RESULT:",
      result
    );

    console.log(
      "Rendering result in UI..."
    );

    renderJobAnalysis(
      result as JobSummary
    );

    console.log(
      "UI rendering completed"
    );
  } catch (error) {
    console.error(
      "Analysis error:",
      error
    );

    renderError(
      error instanceof Error
        ? error.message
        : "Failed to analyze job"
    );
  } finally {
    analysisInProgress = false;
  }
}

/**
 * Watch LinkedIn for job changes.
 *
 * LinkedIn is an SPA, so clicking another job
 * doesn't necessarily reload the page.
 */
function watchForJobChanges() {
  let currentJobId =
    getCurrentJobId();

  console.log(
    "Initial Job ID:",
    currentJobId
  );

  /**
   * Process the initially selected job.
   */
  if (currentJobId) {
    lastJobId = currentJobId;

    processJob(currentJobId);
  }

  /**
   * Check the URL periodically because LinkedIn
   * changes currentJobId without a full page reload.
   */
  setInterval(() => {
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

    lastJobId = newJobId;

    /**
     * Reset the previous JD.
     *
     * This is important because the new job's DOM
     * may initially still contain the previous job.
     */
    lastJobDescription = null;

    processJob(newJobId);
  }, 500);
}

/**
 * Create UI first.
 */
createAnalyzerPanel();

/**
 * Then start watching LinkedIn.
 */
watchForJobChanges();