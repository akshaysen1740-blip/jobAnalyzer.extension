console.log("LinkedIn Job Analyzer loaded");

function getJobDescription(): string | null {
  const element = document.querySelector(
    '[data-testid="expandable-text-box"]'
  );

  if (!element) {
    return null;
  }

  return element.textContent?.trim() ?? null;
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

  console.log("Job description found!");
  console.log("Description length:", jobDescription.length);
  console.log("Description:", jobDescription);

  try {
    const result = await analyzeJob(jobDescription);

    console.log("AI RESULT:");
    console.log(result);
  } catch (error) {
    console.error("Analysis error:", error);
  }
}

main();
