let _isTeams = null;

export async function isRunningInTeams() {
  if (_isTeams !== null) return _isTeams;
  if (typeof window === "undefined") return (_isTeams = false);

  const inIframe = window.self !== window.top;
  if (!inIframe) return (_isTeams = false);

  try {
    const { app } = await import("@microsoft/teams-js");
    await app.initialize();
    const ctx = await app.getContext();
    _isTeams = !!ctx?.app?.host?.name;
  } catch {
    _isTeams = false;
  }

  return _isTeams;
}

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
 * Bootstraps MSAL silently from the Teams SSO token.
 *
 * Teams gives us a real AAD JWT (same user, same tenant, same client ID).
 * We decode it, build a minimal AccountInfo object, set it as the active
 * MSAL account, then call acquireTokenSilent — MSAL will hit AAD's
 * /token endpoint using the existing SSO session cookie that Teams already
 * has, with no popup or redirect needed at all.
 *
 * @param {object} msalInstance - the PublicClientApplication instance
 * @param {object} loginRequest - your loginRequest scopes config
 * @returns {Promise<void>}
 */
export async function bootstrapTeamsMsal(msalInstance, loginRequest) {
  // Step 1: Get the Teams-issued token (audience = your app client ID)
  const teamsToken = await getTeamsClientToken();

  // Step 2: Decode to extract account identifiers
  const payload = JSON.parse(atob(teamsToken.split(".")[1]));

  const loginHint =
    payload.preferred_username || payload.upn || payload.unique_name;
  const tenantId = payload.tid;
  const localAccountId = payload.oid;
  const homeAccountId = `${payload.oid}.${payload.tid}`;

  if (!loginHint || !tenantId || !localAccountId) {
    throw new Error("Teams token missing required claims (upn/tid/oid)");
  }

  // Step 3: Check if MSAL already has this account cached — if so, done
  const existing = msalInstance.getAllAccounts();
  const alreadyCached = existing.find(
    (a) => a.localAccountId === localAccountId,
  );
  if (alreadyCached) {
    msalInstance.setActiveAccount(alreadyCached);
    return; // Already good — acquireTokenSilent will work normally downstream
  }

  // Step 4: ssoSilent — uses the AAD session cookie Teams holds internally.
  // No popup, no redirect, no user interaction. This is the correct Teams SSO path.
  // It succeeds because the user is already authenticated at the AAD level inside Teams.
  await msalInstance.ssoSilent({
    ...loginRequest,
    loginHint,
    // Scope down to the tenant so AAD doesn't ask for account picker
    authority: `https://login.microsoftonline.com/${tenantId}`,
  });

  // ssoSilent populated the MSAL cache — isAuthenticated will now be true
}

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
  return res.json();
}