// teamsAuth.js — Fixed for Teams Store App compatibility
// Key fixes:
//   1. Promise-based getAuthToken (teams-js v2)
//   2. app.initialize() guarded against double-calls
//   3. ssoSilent with fallback to acquireTokenSilent
//   4. Granular error logging for every failure mode
//   5. Cache invalidation flag so slow SDK init isn't permanently cached as false
//   6. Structured debugInfo attached to thrown errors for UI display

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
export async function isRunningInTeams() {
  if (_isTeams === true) return true;
  if (typeof window === "undefined") return false;

  const inIframe = window.self !== window.top;
  if (!inIframe) {
    _isTeams = false;
    console.log("[TeamsAuth] Not in iframe — skipping Teams path");
    return false;
  }

  const sdkReady = await _initTeamsApp();
  if (!sdkReady) {
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
export async function getTeamsClientToken() {
  const sdkReady = await _initTeamsApp();
  if (!sdkReady) throw new Error("Teams SDK failed to initialize — cannot get auth token");

  const { authentication } = await import("@microsoft/teams-js");

  console.log("[TeamsAuth] Requesting Teams client token (promise API)…");

  try {
    const token = await authentication.getAuthToken();
    if (!token) throw new Error("getAuthToken() resolved with empty token");

    const payload = _decodeJwt(token);
    console.log(
      "[TeamsAuth] ✅ Got Teams token — oid:",
      payload?.oid,
      "tid:",
      payload?.tid,
      "upn:",
      payload?.preferred_username ?? payload?.upn
    );
    return token;
  } catch (err) {
    const code = err?.errorCode ?? err?.code ?? "unknown";
    const msg = err?.message ?? String(err);
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
// Attaches a `debugInfo` object to any thrown error for UI display.
//
// Strategy:
//   1. Get Teams client token (proves user identity)
//   2. If MSAL already has this account cached → done
//   3. Try ssoSilent (preferred)
//   4. Fallback to acquireTokenSilent (works when 3rd-party cookies blocked)
//   5. Both fail → throw error with full structured debugInfo
//
export async function bootstrapTeamsMsal(msalInstance, loginRequest) {
  console.log("[TeamsAuth] ── bootstrapTeamsMsal START ──────────────────────");

  // ── Step 1: Get Teams token ──────────────────────────────────────────────
  let teamsToken, payload;
  try {
    teamsToken = await getTeamsClientToken();
    payload = _decodeJwt(teamsToken);
  } catch (err) {
    console.error("[TeamsAuth] Step 1 FAILED — could not get Teams token:", err.message);

    const wrappedErr = new Error(`Step 1 failed — could not get Teams client token: ${err.message}`);
    wrappedErr.debugInfo = {
      failedAt: "step1_getTeamsClientToken",
      error: err.message,
      origin: typeof window !== "undefined" ? window.location.origin : "unknown",
      clientId: msalInstance.getConfiguration?.()?.auth?.clientId ?? "unknown",
      time: new Date().toISOString(),
    };
    throw wrappedErr;
  }

  if (!payload) {
    const err = new Error("Teams token could not be decoded — malformed JWT");
    err.debugInfo = {
      failedAt: "step1_jwtDecode",
      error: "JWT payload decode returned null",
      origin: typeof window !== "undefined" ? window.location.origin : "unknown",
      clientId: msalInstance.getConfiguration?.()?.auth?.clientId ?? "unknown",
      time: new Date().toISOString(),
    };
    throw err;
  }

  const loginHint = payload.preferred_username ?? payload.upn ?? payload.unique_name ?? null;
  const tenantId = payload.tid ?? null;
  const localAccountId = payload.oid ?? null;
  const homeAccountId =
    localAccountId && tenantId ? `${localAccountId}.${tenantId}` : null;

  console.log(
    "[TeamsAuth] Token claims — loginHint:",
    loginHint,
    "| tid:",
    tenantId,
    "| oid:",
    localAccountId
  );

  if (!loginHint || !tenantId || !localAccountId) {
    const missing = [
      !loginHint && "upn/preferred_username",
      !tenantId && "tid",
      !localAccountId && "oid",
    ]
      .filter(Boolean)
      .join(", ");

    const err = new Error(
      `Teams token is missing required claims: ${missing}. ` +
        `Ensure "upn", "tid", and "oid" optional claims are configured in your Azure app registration.`
    );
    err.debugInfo = {
      failedAt: "step1_claimsValidation",
      missingClaims: missing,
      claimsPresent: Object.keys(payload),
      loginHint,
      tenantId,
      localAccountId,
      origin: typeof window !== "undefined" ? window.location.origin : "unknown",
      clientId: msalInstance.getConfiguration?.()?.auth?.clientId ?? "unknown",
      time: new Date().toISOString(),
    };
    throw err;
  }

  // ── Step 2: Check MSAL cache ────────────────────────────────────────────
  const existing = msalInstance.getAllAccounts();
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
  let ssoErrInfo = null;

  try {
    console.log("[TeamsAuth] Step 3 — Attempting ssoSilent with authority:", tenantAuthority);
// Step 3 — replace your existing ssoSilent call with this:
await msalInstance.ssoSilent({
  ...loginRequest,
  loginHint,
  authority: tenantAuthority,
  redirectUri: `${window.location.origin}/checking`,  // ← must match Azure redirect URI
  prompt: "none",                                      // ← enforce silent, no UI allowed
});
    ssoSuccess = true;
    console.log("[TeamsAuth] ✅ Step 3 — ssoSilent succeeded");
  } catch (ssoErr) {
    ssoErrInfo = {
      errorCode: ssoErr?.errorCode ?? ssoErr?.name ?? "unknown",
      message: ssoErr?.message ?? String(ssoErr),
      subError: ssoErr?.subError ?? null,
      correlationId: ssoErr?.correlationId ?? null,
    };
    console.warn(`[TeamsAuth] ⚠️ Step 3 — ssoSilent failed:`, ssoErrInfo);
  }

  if (ssoSuccess) return;

  // ── Step 4: acquireTokenSilent fallback ─────────────────────────────────
  console.log("[TeamsAuth] Step 4 — Trying acquireTokenSilent fallback…");

  let silentErrInfo = null;

  const syntheticAccount = {
    homeAccountId,
    localAccountId,
    environment: "login.windows.net",
    tenantId,
    username: loginHint,
    name: payload.name ?? loginHint,
    idTokenClaims: payload,
  };

  try {
// Step 4 — replace your existing acquireTokenSilent call with this:
const silentResult = await msalInstance.acquireTokenSilent({
  ...loginRequest,
  account: syntheticAccount,
  authority: tenantAuthority,
  forceRefresh: false,
  redirectUri: `${window.location.origin}/checking`,  // ← same here
});
    console.log(
      "[TeamsAuth] ✅ Step 4 — acquireTokenSilent succeeded, account:",
      silentResult.account?.username
    );
    msalInstance.setActiveAccount(silentResult.account);
    return;
  } catch (silentErr) {
    silentErrInfo = {
      errorCode: silentErr?.errorCode ?? silentErr?.name ?? "unknown",
      message: silentErr?.message ?? String(silentErr),
      subError: silentErr?.subError ?? null,
      correlationId: silentErr?.correlationId ?? null,
    };
    console.error("[TeamsAuth] ❌ Step 4 — acquireTokenSilent failed:", silentErrInfo);
  }

  // ── Both paths failed — throw with full structured debugInfo ─────────────
  console.error("[TeamsAuth] ❌ All silent auth strategies exhausted.");

  const finalErr = new Error(
    "Teams silent auth failed — both ssoSilent and acquireTokenSilent unsuccessful. " +
      "See debugInfo panel for exact error codes."
  );
  finalErr.debugInfo = {
    step3_ssoSilent: ssoErrInfo,
    step4_acquireTokenSilent: silentErrInfo,
    loginHint,
    tenantId,
    localAccountId,
    origin: typeof window !== "undefined" ? window.location.origin : "unknown",
    clientId: msalInstance.getConfiguration?.()?.auth?.clientId ?? "unknown",
    time: new Date().toISOString(),
  };
  throw finalErr;
}

// ─── OBO token exchange ───────────────────────────────────────────────────────
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