/**
 * Call the Express backend.
 *
 * This is where the actual API URL and port live.
 */
async function callJobAnalysisApi(
  jobDescription: string
) {
  console.log(
    "BACKGROUND: calling Express API..."
  );

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

  console.log(
    "BACKGROUND: Express response status:",
    response.status
  );

  /**
   * HTTP 400/500 etc.
   */
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status}`
    );
  }

  /**
   * Convert Express response to JSON.
   */
  const data = await response.json();

  console.log(
    "BACKGROUND: API response data:",
    data
  );

  return data;
}

/**
 * Listen for messages from content.ts.
 */
chrome.runtime.onMessage.addListener(
  (
    message,
    _sender,
    sendResponse
  ) => {
    console.log(
      "BACKGROUND: message received:",
      message.type
    );

    /**
     * Ignore messages that aren't for us.
     */
    if (
      message.type !== "ANALYZE_JOB"
    ) {
      return;
    }

    console.log(
      "BACKGROUND: received job description"
    );

    console.log(
      "BACKGROUND: description length:",
      message.jobDescription?.length
    );

    /**
     * Call Express API.
     */
    callJobAnalysisApi(
      message.jobDescription
    )
      .then((result) => {
        console.log(
          "BACKGROUND: API response received:",
          result
        );

        /**
         * Send the result back to content.ts.
         */
        sendResponse({
          success: true,
          data: result,
        });

        console.log(
          "BACKGROUND: sendResponse called"
        );
      })
      .catch((error) => {
        console.error(
          "BACKGROUND: API request failed:",
          error
        );

        /**
         * Send the error back to content.ts.
         */
        sendResponse({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        });

        console.log(
          "BACKGROUND: error response sent"
        );
      });

    /**
     * IMPORTANT:
     *
     * The response is asynchronous because fetch()
     * hasn't completed yet.
     *
     * Returning true keeps the message channel
     * open until sendResponse() is called.
     */
    return true;
  }
);