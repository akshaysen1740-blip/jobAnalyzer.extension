export interface JobSummary {
  title: string | null;

  profileName: string | null;

  companyName: string | null;

  location: string | null;

  qualification: string | null;

  experience: {
    min: number | null;
    max: number | null;
  };

  seniority: string | null;

  technologies: {
    name: string;
    category: string;
    required: boolean;
  }[];

  responsibilities: string[];

  requirements: string[];

  niceToHave: string[];
}

/**
 * Create the analyzer sidebar.
 *
 * The panel is created once but starts hidden.
 */
export function createAnalyzerPanel() {
  if (document.getElementById("job-analyzer-panel")) {
    return;
  }

  const style = document.createElement("style");

  style.textContent = `
    #job-analyzer-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 25vw;
      min-width: 320px;
      max-width: 420px;
      height: 100vh;

      background: #fff;
      border-left: 1px solid #ddd;
      box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);

      z-index: 999999;
      box-sizing: border-box;

      font-family: Arial, sans-serif;
      color: #1f1f1f;

      display: none;
    }

    #workspace.job-analyzer-open {
      width: calc(100% - clamp(320px, 25vw, 420px)) !important;
      max-width: calc(100% - clamp(320px, 25vw, 420px)) !important;
    }

    .job-analyzer-header {
      height: 60px;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #ddd;
      box-sizing: border-box;
    }

    .job-analyzer-header h2 {
      margin: 0;
      font-size: 18px;
    }

    #job-analyzer-close {
      border: none;
      background: transparent;
      font-size: 24px;
      cursor: pointer;
    }

    .job-analyzer-body {
      padding: 20px;
      overflow-y: auto;
      height: calc(100vh - 60px);
      box-sizing: border-box;
    }

    .job-analyzer-title {
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 6px;
    }

    .job-analyzer-company {
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }

    .job-analyzer-section {
      margin-bottom: 24px;
    }

    .job-analyzer-section h3 {
      font-size: 14px;
      margin: 0 0 10px;
      font-weight: 600;
    }

    .job-analyzer-section ul {
      margin: 0;
      padding-left: 20px;
    }

    .job-analyzer-section li {
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.4;
    }

    .job-analyzer-tech {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .job-analyzer-tech-item {
      padding: 6px 10px;
      border-radius: 14px;
      background: #f1f3f5;
      font-size: 12px;
    }

    .job-analyzer-required {
      font-weight: 600;
    }

    .job-analyzer-loading {
      color: #666;
      font-size: 14px;
    }

    .job-analyzer-error {
      color: #b42318;
      font-size: 14px;
    }

    .job-analyzer-redirect {
      text-align: center;
      margin-top: 80px;
    }

    .job-analyzer-redirect h3 {
      font-size: 20px;
      margin-bottom: 10px;
    }

    .job-analyzer-redirect p {
      color: #666;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .job-analyzer-jobs-button {
      border: none;
      border-radius: 6px;
      padding: 10px 16px;
      background: #0a66c2;
      color: white;
      font-size: 14px;
      cursor: pointer;
    }

    .job-analyzer-jobs-button:hover {
      background: #004182;
    }
  `;

  document.head.appendChild(style);

  const panel = document.createElement("div");

  panel.id = "job-analyzer-panel";

  panel.innerHTML = `
    <div class="job-analyzer-header">
      <h2>Job Analyzer</h2>

      <button
        id="job-analyzer-close"
        type="button"
      >
        ×
      </button>
    </div>

    <div
      id="job-analyzer-content"
      class="job-analyzer-body"
    >
      <p class="job-analyzer-loading">
        Ready to analyze this job.
      </p>
    </div>
  `;

  document.body.appendChild(panel);

  document
    .getElementById("job-analyzer-close")
    ?.addEventListener("click", () => {
      hideAnalyzerPanel();
    });
}

/**
 * Show the analyzer sidebar.
 */
export function showAnalyzerPanel() {
  const panel = document.getElementById("job-analyzer-panel");

  const workspace = document.getElementById("workspace");

  if (!panel || !workspace) {
    return;
  }

  panel.style.display = "block";

  workspace.classList.add("job-analyzer-open");
}

/**
 * Hide the analyzer sidebar.
 */
export function hideAnalyzerPanel() {
  const panel = document.getElementById("job-analyzer-panel");

  const workspace = document.getElementById("workspace");

  if (!panel || !workspace) {
    return;
  }

  panel.style.display = "none";

  workspace.classList.remove("job-analyzer-open");
}

/**
 * Check whether the analyzer sidebar is open.
 */
export function isPanelOpen(): boolean {
  const panel = document.getElementById("job-analyzer-panel");

  if (!panel) {
    return false;
  }

  return panel.style.display !== "none";
}

/**
 * Show a message when the user is not
 * currently on LinkedIn Jobs.
 */
export function renderJobsRedirect() {
  const container = document.getElementById("job-analyzer-content");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="job-analyzer-redirect">

      <h3>
        LinkedIn Jobs
      </h3>

      <p>
        Open the LinkedIn Jobs section
        to analyze job postings.
      </p>

      <button
        id="job-analyzer-jobs-button"
        class="job-analyzer-jobs-button"
        type="button"
      >
        Go to LinkedIn Jobs
      </button>

    </div>
  `;

  document
    .getElementById("job-analyzer-jobs-button")
    ?.addEventListener("click", () => {
      window.location.href = "https://www.linkedin.com/jobs/";
    });
}

/**
 * Show loading state.
 */
export function renderLoading() {
  const container = document.getElementById("job-analyzer-content");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <p class="job-analyzer-loading">
      Analyzing job...
    </p>
  `;
}

/**
 * Show error state.
 */
export function renderError(message: string) {
  const container = document.getElementById("job-analyzer-content");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <p class="job-analyzer-error">
      ${message}
    </p>
  `;
}

/**
 * Render the AI job analysis.
 */
export function renderJobAnalysis(result: JobSummary) {
  const container = document.getElementById("job-analyzer-content");

  if (!container) {
    return;
  }

  const experience =
    result.experience.min !== null || result.experience.max !== null
      ? `${result.experience.min ?? "Any"} - ${
          result.experience.max ?? "Any"
        } years`
      : "Not specified";

  container.innerHTML = `
    <div class="job-analyzer-section">

      <h1 class="job-analyzer-title">
        ${result.title ?? "Untitled position"}
      </h1>

      <div class="job-analyzer-company">
        ${result.companyName ?? "Company not specified"}
        ${result.profileName ? ` · ${result.profileName}` : ""}
        ${result.location ? ` · ${result.location}` : ""}
      </div>

    </div>

    <div class="job-analyzer-section">
      <h3>Experience</h3>

      <div>
        ${experience}
      </div>
    </div>

    <div class="job-analyzer-section">
      <h3>Qualification</h3>

      <div>
        ${result.qualification ?? "Not specified"}
      </div>
    </div>

    <div class="job-analyzer-section">
      <h3>Seniority</h3>

      <div>
        ${result.seniority ?? "Not specified"}
      </div>
    </div>

    <div class="job-analyzer-section">

      <h3>Technologies</h3>

      <div class="job-analyzer-tech">

        ${result.technologies
          .map(
            (technology) => `
                <span
                  class="job-analyzer-tech-item"
                >
                  ${technology.name}

                  ${
                    technology.required
                      ? `
                        <span
                          class="job-analyzer-required"
                        >
                          *
                        </span>
                      `
                      : ""
                  }

                </span>
              `,
          )
          .join("")}

      </div>
    </div>

    <div class="job-analyzer-section">

      <h3>Responsibilities</h3>

      <ul>

        ${result.responsibilities
          .map(
            (item) => `
                <li>
                  ${item}
                </li>
              `,
          )
          .join("")}

      </ul>

    </div>

    <div class="job-analyzer-section">

      <h3>Requirements</h3>

      <ul>

        ${result.requirements
          .map(
            (item) => `
                <li>
                  ${item}
                </li>
              `,
          )
          .join("")}

      </ul>

    </div>

    <div class="job-analyzer-section">

      <h3>Nice to Have</h3>

      <ul>

        ${result.niceToHave
          .map(
            (item) => `
                <li>
                  ${item}
                </li>
              `,
          )
          .join("")}

      </ul>

    </div>
  `;
}
