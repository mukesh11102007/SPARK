// Placeholder Webhook URLs - To be replaced by the user later
const WEBHOOK_URLS = {
  watchdog: 'https://api.agents.snsihub.ai/webhook-test/watchdog_error',
  deployment: 'https://webhook.site/placeholder-deployment',
  errorAlert: 'https://webhook.site/placeholder-error-alert',
  versionControl: 'https://webhook.site/placeholder-version-control',
};

export const triggerAutomation = async (workflowName, payload) => {
  const url = WEBHOOK_URLS[workflowName];
  if (!url) {
    console.warn(`Webhook URL for ${workflowName} not found.`);
    return null;
  }

  console.log(`[AutomationService] Triggering ${workflowName}...`, payload);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Automation ${workflowName} failed with status ${response.status}`);
    }

    const data = await response.json().catch(() => ({})); // Handle empty responses
    return data;
  } catch (error) {
    console.error(`[AutomationService] Error triggering ${workflowName}:`, error);
    throw error;
  }
};
