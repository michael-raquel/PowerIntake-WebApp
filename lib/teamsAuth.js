/**
 * Detects whether the app is running inside a Microsoft Teams iframe
 * and provides a Teams-SSO-based token exchange flow.
 *
 * Teams SSO flow:
 * 1. Call app.initialize() + authentication.getAuthToken() to get a Teams
 *    client-side token (audience = your app's client ID).
 * 2. Send that token to your backend OBO (on-behalf-of) endpoint.
 * 3. Backend exchanges it for a real AAD access token via OBO flow.
 * 4. Return the AAD token to the frontend.
 *
 * If you don't have an OBO endpoint yet, the fallback is to use the Teams
 * token directly with MSAL's ssoSilent using the UPN as loginHint.
 */

let _isTeams = null;

export async function isRunningInTeams() {
  if (_isTeams !== null) return _isTeams;
  if (typeof window === "undefined") return (_isTeams = false);

  // Teams sets window.parent !== window (iframe) AND injects specific params
  const inIframe = window.self !== window.top;
  if (!inIframe) return (_isTeams = false);

  try {
    const { app } = await import("@microsoft/teams-js");
    await app.initialize();
    const ctx = await app.getContext();
    _isTeams = !!ctx?.app?.host?.name; // "Teams", "TeamsModern", etc.
  } catch {
    _isTeams = false;
  }

  return _isTeams;
}

/**
 * Gets a Teams client token (via Teams JS SDK getAuthToken).
 * This token's audience is your AAD app client ID.
 * Use it as-is for your own API, or exchange it via OBO on the backend.
 */
export async function getTeamsClientToken() {
  const { authentication } = await import("@microsoft/teams-js");
  return new Promise((resolve, reject) => {
    authentication.getAuthToken({
      successCallback: resolve,
      failureCallback: reject,
    });
  });
}

/**
 * Full Teams SSO: gets a Teams token and exchanges it at your backend
 * OBO endpoint for a proper AAD access token your app can use.
 *
 * @param {string} oboEndpoint - e.g. "/api/auth/teams-token"
 * @returns {Promise<{accessToken: string, account: object}>}
 */
export async function getTeamsAccessToken(oboEndpoint) {
  const teamsToken = await getTeamsClientToken();

  const res = await fetch(oboEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamsToken }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OBO exchange failed: ${res.status} ${text}`);
  }

  return res.json(); // expects { accessToken, account: { username, localAccountId, ... } }
}