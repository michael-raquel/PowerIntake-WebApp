// teamsAuth.js — Fixed for Teams Store App compatibility
// Key fixes:
//   1. Promise-based getAuthToken (teams-js v2)
//   2. app.initialize() guarded against double-calls
//   3. ssoSilent with fallback to acquireTokenSilent
//   4. Granular error logging for every failure mode
//   5. Cache invalidation flag so slow SDK init isn't permanently cached as false

let _isTeams = null;
let _teamsAppInitialized = false;
let _teamsInitializing = false;
let _teamsInitPromise = null;

// ─── Internal: initialize Teams SDK exactly once ─────────────────────────────
async function _initTeamsApp() {
  if (_teamsAppInitialized) return true;
  if (_teamsInitializing) return _teamsInitPromise;

  _teamsInitializing = true;
  _teamsInitPromise = (async () => {
    try {
      const { app } = await import("@microsoft/teams-js");
      await app.initialize();
      _teamsAppInitialized = true;
      console.log("[TeamsAuth] ✅ Teams SDK initialized");
      return true;
    } catch (err) {
      console.warn("[TeamsAuth] ⚠️ Teams SDK initialize() failed:", err?.message ?? err);
      return false;
    } finally {
      _teamsInitializing = false;
    }
  })();

  return _teamsInitPromise;
}

// ─── isRunningInTeams ────────────────────────────────────────────────────────
// Returns true only when we are inside a real Teams iframe and SDK responds.
// Result is cached after first successful resolution (not on first failure).
export async function isRunningInTeams() {
  if (_isTeams === true) return true;       // confirmed Teams — reuse
  if (typeof window === "undefined") return false;

  // Quick bail: not inside an iframe → definitely not Teams
  const inIframe = window.self !== window.top;
  if (!inIframe) {
    _isTeams = false;
    console.log("[TeamsAuth] Not in iframe — skipping Teams path");
    return false;
  }

  const sdkReady = await _initTeamsApp();
  if (!sdkReady) {
    // Don't permanently cache false — SDK might still load later
    console.warn("[TeamsAuth] SDK not ready; treating as non-Teams for this call");
    return false;
  }

  try {
    const { app } = await import("@microsoft/teams-js");
    const ctx = await app.getContext();
    const hostName = ctx?.app?.host?.name ?? null;
    _isTeams = !!hostName;
    console.log(`[TeamsAuth] getContext hostName="${hostName}" → inTeams=${_isTeams}`);
  } catch (err) {
    console.warn("[TeamsAuth] getContext() threw:", err?.message ?? err);
    _isTeams = false;
  }

  return _isTeams;
}

// ─── getTeamsClientToken ─────────────────────────────────────────────────────
// Uses the teams-js v2 promise API (not the deprecated callback form).
// This is the #1 reason Store apps fail — the callback API is broken in some
// Teams Store environments; the promise API works universally.
export async function getTeamsClientToken() {
  const sdkReady = await _initTeamsApp();
  if (!sdkReady) throw new Error("Teams SDK failed to initialize — cannot get auth token");

  const { authentication } = await import("@microsoft/teams-js");

  console.log("[TeamsAuth] Requesting Teams client token (promise API)…");

  try {
    // ✅ Promise-based — works in Teams Store, Desktop, Web, Mobile
    const token = await authentication.getAuthToken();
    if (!token) throw new Error("getAuthToken() resolved with empty token");

    // Quick decode to confirm claims are present before returning
    const payload = _decodeJwt(token);
    console.log("[TeamsAuth] ✅ Got Teams token — oid:", payload?.oid, "tid:", payload?.tid, "upn:", payload?.preferred_username ?? payload?.upn);
    return token;
  } catch (err) {
    // Surface the Teams-specific error code if present
    const code = err?.errorCode ?? err?.code ?? "unknown";
    const msg  = err?.message ?? String(err);
    console.error(`[TeamsAuth] ❌ getAuthToken() failed — code: ${code}, message: ${msg}`);
    throw new Error(`Teams token acquisition failed (${code}): ${msg}`);
  }
}

// ─── Helper: decode JWT payload ───────────────────────────────────────────────
function _decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// ─── bootstrapTeamsMsal ──────────────────────────────────────────────────────
// Full silent SSO flow with layered fallbacks and detailed logging.
//
// Strategy:
//   1. Get Teams client token (proves user identity)
//   2. If MSAL already has this account cached → done
//   3. Try ssoSilent (preferred — no interaction)
//   4. If ssoSilent fails with interaction_required/consent → try
//      acquireTokenSilent with a loginHint (works when 3rd-party cookies
//      are blocked, which is common in Teams Store / Webview2)
//   5. If both fail → throw a descriptive error so the UI can show it
//
export async function bootstrapTeamsMsal(msalInstance, loginRequest) {
  console.log("[TeamsAuth] ── bootstrapTeamsMsal START ──────────────────────");

  // ── Step 1: Get Teams token ──────────────────────────────────────────────
  let teamsToken, payload;
  try {
    teamsToken = await getTeamsClientToken();
    payload    = _decodeJwt(teamsToken);
  } catch (err) {
    console.error("[TeamsAuth] Step 1 FAILED — could not get Teams token:", err.message);
    throw err;
  }

  if (!payload) {
    throw new Error("Teams token could not be decoded — malformed JWT");
  }

  const loginHint      = payload.preferred_username ?? payload.upn ?? payload.unique_name ?? null;
  const tenantId       = payload.tid ?? null;
  const localAccountId = payload.oid ?? null;
  const homeAccountId  = localAccountId && tenantId ? `${localAccountId}.${tenantId}` : null;

  console.log("[TeamsAuth] Token claims — loginHint:", loginHint, "| tid:", tenantId, "| oid:", localAccountId);

  if (!loginHint || !tenantId || !localAccountId) {
    const missing = [!loginHint && "upn/preferred_username", !tenantId && "tid", !localAccountId && "oid"].filter(Boolean).join(", ");
    throw new Error(`Teams token is missing required claims: ${missing}. Check your Azure app registration — ensure "upn", "tid", and "oid" optional claims are configured.`);
  }

  // ── Step 2: Check MSAL cache ────────────────────────────────────────────
  const existing      = msalInstance.getAllAccounts();
  const alreadyCached = existing.find((a) => a.localAccountId === localAccountId);

  if (alreadyCached) {
    msalInstance.setActiveAccount(alreadyCached);
    console.log("[TeamsAuth] ✅ Step 2 — Account already in MSAL cache, set as active. Done.");
    return;
  }

  console.log("[TeamsAuth] No cached account found — proceeding with ssoSilent");

  const tenantAuthority = `https://login.microsoftonline.com/${tenantId}`;

  // ── Step 3: ssoSilent ───────────────────────────────────────────────────
  let ssoSuccess = false;
  try {
    console.log("[TeamsAuth] Step 3 — Attempting ssoSilent with authority:", tenantAuthority);
    await msalInstance.ssoSilent({
      ...loginRequest,
      loginHint,
      authority: tenantAuthority,
    });
    ssoSuccess = true;
    console.log("[TeamsAuth] ✅ Step 3 — ssoSilent succeeded");
  } catch (ssoErr) {
    const code = ssoErr?.errorCode ?? ssoErr?.name ?? "unknown";
    const msg  = ssoErr?.message ?? String(ssoErr);
    console.warn(`[TeamsAuth] ⚠️ Step 3 — ssoSilent failed (${code}): ${msg}`);
    console.warn("[TeamsAuth] Full ssoSilent error:", ssoErr);
  }

  if (ssoSuccess) return;

  // ── Step 4: acquireTokenSilent fallback ─────────────────────────────────
  // Teams Store Webview2 often blocks 3rd-party cookies, breaking ssoSilent.
  // acquireTokenSilent uses the token cache + refresh token instead.
  console.log("[TeamsAuth] Step 4 — Trying acquireTokenSilent fallback…");

  // We need a minimal AccountInfo to pass to acquireTokenSilent
  const syntheticAccount = {
    homeAccountId:  homeAccountId,
    localAccountId: localAccountId,
    environment:    "login.windows.net",
    tenantId:       tenantId,
    username:       loginHint,
    name:           payload.name ?? loginHint,
    idTokenClaims:  payload,
  };

  try {
    const silentResult = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account:   syntheticAccount,
      authority: tenantAuthority,
      forceRefresh: false,
    });
    console.log("[TeamsAuth] ✅ Step 4 — acquireTokenSilent fallback succeeded, account:", silentResult.account?.username);
    msalInstance.setActiveAccount(silentResult.account);
    return;
  } catch (silentErr) {
    const code = silentErr?.errorCode ?? silentErr?.name ?? "unknown";
    const msg  = silentErr?.message ?? String(silentErr);
    console.error(`[TeamsAuth] ❌ Step 4 — acquireTokenSilent fallback failed (${code}): ${msg}`);
    console.error("[TeamsAuth] Full acquireTokenSilent error:", silentErr);
  }

  // ── Both paths failed ────────────────────────────────────────────────────
  console.error("[TeamsAuth] ❌ All silent auth strategies exhausted. Diagnosis checklist:");
  console.error("  1. Is the Teams app manifest 'validDomains' correct?");
  console.error("  2. Is 'api://YOUR_DOMAIN/CLIENT_ID' listed in Azure app Expose an API?");
  console.error("  3. Is admin consent granted for the tenant?");
  console.error("  4. Does the Azure app have 'access_as_user' scope exposed?");
  console.error("  5. Is the app published to the Teams Store or only sideloaded?");
  console.error(`  6. Client ID in use: ${msalInstance.getConfiguration?.()?.auth?.clientId ?? "unknown"}`);

  throw new Error(
    "Teams silent authentication failed. Both ssoSilent and acquireTokenSilent were unsuccessful. " +
    "This usually means: (a) admin consent is missing, (b) the Azure app is not configured for SSO, " +
    "or (c) the Teams app manifest validDomains / webApplicationInfo is misconfigured. " +
    "Check the browser console for detailed logs."
  );
}

// ─── OBO token exchange (unchanged, kept for completeness) ───────────────────
export async function getTeamsAccessToken(oboEndpoint) {
  const teamsToken = await getTeamsClientToken();
  const res = await fetch(oboEndpoint, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ teamsToken }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OBO exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}