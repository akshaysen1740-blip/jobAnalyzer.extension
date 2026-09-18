declare const __JOB_ANALYZER_API_URL__: string;

/**
 * Call the Express backend.
 */
async function callJobAnalysisApi(
  jobDescription: string,
  companyName: string | null,
  profileName: string | null,
) {
  console.log("BACKGROUND: calling Express API...");

  const response = await fetch(
    __JOB_ANALYZER_API_URL__,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        jobDescription,
        companyName,
        profileName,
      }),
    },
  );

  console.log("BACKGROUND: Express response status:", response.status);

  /**
   * HTTP 400/500 etc.
   */
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  /**
   * Convert Express response to JSON.
   */
  const data = await response.json();

  console.log("BACKGROUND: API response data:", data);

  return data;
}

/**
 * Handle Chrome extension icon click.
 *
 * There is NO popup.
 *
 * Clicking the extension icon sends a message
 * directly to the active tab.
 */
chrome.action.onClicked.addListener(async (tab) => {
  console.log("BACKGROUND: extension icon clicked");

  if (!tab.id) {
    console.log("BACKGROUND: active tab has no ID");

    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "TOGGLE_PANEL",
    });

    console.log("BACKGROUND: TOGGLE_PANEL sent");
  } catch (error) {
    console.error("BACKGROUND: failed to send TOGGLE_PANEL:", error);
  }
});

/**
 * Listen for messages from content.ts.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("BACKGROUND: message received:", message?.type);

  /**
   * Ignore messages that aren't for us.
   */
  if (message?.type !== "ANALYZE_JOB") {
    return;
  }

  console.log("BACKGROUND: received job description");

  console.log(
    "BACKGROUND: description length:",
    message.jobDescription?.length,
  );

  console.log("BACKGROUND: company name:", message.companyName);

  console.log("BACKGROUND: profile name:", message.profileName);

  /**
   * Call Express API.
   */
  callJobAnalysisApi(
    message.jobDescription,
    message.companyName ?? null,
    message.profileName ?? null,
  )
    .then((result) => {
      console.log("BACKGROUND: API response received:", result);

      /**
       * Send the result back to content.ts.
       */
      sendResponse({
        success: true,
        data: result,
      });

      console.log("BACKGROUND: sendResponse called");
    })

    .catch((error) => {
      console.error("BACKGROUND: API request failed:", error);

      /**
       * Send the error back to content.ts.
       */
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      console.log("BACKGROUND: error response sent");
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
});
