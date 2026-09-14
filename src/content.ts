import { analyzeJob } from "./background";

console.log("LinkedIn Job Analyzer loaded");

function getJobDescription(): string | null {
  const element = document.querySelector('[data-testid="expandable-text-box"]');

  if (!element) {
    return null;
  }

  // Clone the element so we don't modify LinkedIn's actual DOM
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove the "… more" button
  const moreButton = clone.querySelector(
    '[data-testid="expandable-text-button"]',
  );

  moreButton?.remove();

  const description = clone.textContent?.trim() ?? "";

  return description || null;
}

function waitForJobDescription(): Promise<string> {
  return new Promise((resolve) => {
    const existingDescription = getJobDescription();

    if (existingDescription) {
      resolve(existingDescription);
      return;
    }

    const observer = new MutationObserver(() => {
      const description = getJobDescription();

      if (description) {
        observer.disconnect();
        resolve(description);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

async function main() {
  const jobDescription = await waitForJobDescription();

  try {
    const result = await analyzeJob(jobDescription);
  } catch (error) {
    console.error("Analysis error:", error);
  }
}

main();
