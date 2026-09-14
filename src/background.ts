chrome.runtime.onMessage.addListener(
  (message, _sender, sendResponse) => {
    if (message.type !== "ANALYZE_JOB") {
      return;
    }

    analyzeJob(message.jobDescription)
      .then((result) => {
        sendResponse({
          success: true,
          data: result,
        });
      })
      .catch((error) => {
        console.error("Job analysis failed:", error);

        sendResponse({
          success: false,
          error: error instanceof Error
            ? error.message
            : "Unknown error",
        });
      });

    return true;
  }
);

export async function analyzeJob(
  jobDescription: string
) {
  const response = await fetch(
    "http://localhost:8000/api/jobs/analyze",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        jobDescription,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status}`
    );
  }

  return response.json();
}
