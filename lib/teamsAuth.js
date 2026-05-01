// teamsAuth.js — Teams Store App SSO via OBO flow
//
// Strategy:
//   isRunningInTeams  — iframe check + UA sniff (handles Teams mobile top-level webview)
//   getTeamsClientToken — teams-js v2 promise API
//   bootstrapTeamsMsal:
//     1. Get Teams client token
//     2. Check MSAL cache (skip if already there)
//     3. OBO exchange via backend → store token in sessionStorage
//     4. Best-effort acquireTokenSilent (expected to fail on desktop, fine)
//     5. Set teams_authenticated + consent_verified flags for AuthGuard

let _isTeams = null;
let _teamsAppInitialized = false;
let _teamsInitializing = false;
let _teamsInitPromise = null;

// ─── Internal: initialize Teams SDK exactly once ──────────────────────────────
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

// ─── Helper: decode JWT payload ───────────────────────────────────────────────
function _decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// ─── isRunningInTeams ─────────────────────────────────────────────────────────
// Handles both desktop (iframe) and mobile (top-level webview + UA sniff).
// Teams mobile does NOT run in an iframe — pure UA detection needed there.
export async function isRunningInTeams() {
  if (_isTeams === true) return true;
  if (typeof window === "undefined") return false;

  const inIframe = window.self !== window.top;

  // Teams mobile is a top-level webview — not an iframe.
  // Check user agent as a fallback for mobile detection.
  const ua = navigator.userAgent ?? "";
  const isTeamsUA =
    /Teams\//.test(ua) ||
    /TeamsTabAndroid/.test(ua) ||
    /TeamsTabIOS/.test(ua) ||
    /MicrosoftTeams/.test(ua);

  if (!inIframe && !isTeamsUA) {
    _isTeams = false;
    console.log("[TeamsAuth] Not in iframe and no Teams UA — skipping Teams path");
    return false;
  }

  // Try SDK for a definitive answer
  const sdkReady = await _initTeamsApp();

  if (!sdkReady) {
    // SDK failed but UA says Teams — trust the UA (common on mobile)
    if (isTeamsUA) {
      _isTeams = true;
      console.log("[TeamsAuth] SDK not ready but Teams UA detected — treating as Teams");
      return true;
    }
    console.warn("[TeamsAuth] SDK not ready and no Teams UA — treating as non-Teams");
    return false;
  }

  try {
    const { app } = await import("@microsoft/teams-js");
    const ctx = await app.getContext();
    const hostName = ctx?.app?.host?.name ?? null;
    _isTeams = !!hostName || isTeamsUA;
    console.log(
      `[TeamsAuth] getContext hostName="${hostName}" isTeamsUA=${isTeamsUA} → inTeams=${_isTeams}`
    );
  } catch (err) {
    console.warn("[TeamsAuth] getContext() threw:", err?.message ?? err);
    _isTeams = isTeamsUA; // fall back to UA sniff
  }

  return _isTeams;
}

// ─── getTeamsClientToken ──────────────────────────────────────────────────────
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
      "[TeamsAuth] ✅ Got Teams token — oid:", payload?.oid,
      "tid:", payload?.tid,
      "upn:", payload?.preferred_username ?? payload?.upn
    );
    return token;
  } catch (err) {
    const code = err?.errorCode ?? err?.code ?? "unknown";
    const msg = err?.message ?? String(err);
    console.error(`[TeamsAuth] ❌ getAuthToken() failed — code: ${code}, message: ${msg}`);
    throw new Error(`Teams token acquisition failed (${code}): ${msg}`);
  }
}

// ─── bootstrapTeamsMsal ───────────────────────────────────────────────────────
// OBO-based flow — avoids MSAL hidden iframe (which always times out in Teams desktop).
//
// Steps:
//   1. Get Teams client token via teams-js
//   2. Check MSAL cache — return early if account already present
//   3. POST Teams token to backend /teamsauth/obo-exchange
//   4. Store OBO access token in sessionStorage
//   5. Best-effort acquireTokenSilent (may succeed on mobile, fails silently on desktop)
//   6. Set teams_authenticated + consent_verified flags for AuthGuard
//
export async function bootstrapTeamsMsal(msalInstance, loginRequest) {
  console.log("[TeamsAuth] ── bootstrapTeamsMsal START ──────────────────────");

  // ── Step 1: Get Teams client token ────────────────────────────────────────
  let teamsToken, payload;
  try {
    teamsToken = await getTeamsClientToken();
    payload = _decodeJwt(teamsToken);
  } catch (err) {
    const wrappedErr = new Error(
      `Step 1 failed — could not get Teams client token: ${err.message}`
    );
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

  const loginHint =
    payload.preferred_username ?? payload.upn ?? payload.unique_name ?? null;
  const tenantId = payload.tid ?? null;
  const localAccountId = payload.oid ?? null;
  const homeAccountId =
    localAccountId && tenantId ? `${localAccountId}.${tenantId}` : null;

  console.log(
    "[TeamsAuth] Token claims — loginHint:", loginHint,
    "| tid:", tenantId,
    "| oid:", localAccountId
  );

  // Validate required claims
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

  // ── Step 2: Check MSAL cache ──────────────────────────────────────────────
  const existing = msalInstance.getAllAccounts();
  const alreadyCached = existing.find((a) => a.localAccountId === localAccountId);

  if (alreadyCached) {
    msalInstance.setActiveAccount(alreadyCached);
    console.log("[TeamsAuth] ✅ Step 2 — Account already in MSAL cache. Done.");
    // Re-stamp flags in case sessionStorage was cleared between sessions
    sessionStorage.setItem("consent_verified", "1");
    sessionStorage.setItem("teams_authenticated", "1");
    sessionStorage.setItem("teams_login_hint", loginHint);
    return;
  }

  console.log("[TeamsAuth] No cached MSAL account — proceeding with OBO exchange");

// teamsAuth.js — Step 3
const OBO_ENDPOINT = `${process.env.NEXT_PUBLIC_API_BASE_URL}/teamsauth/obo-exchange`;
  let oboResult;

  try {
    console.log("[TeamsAuth] Step 3 — Calling OBO endpoint:", OBO_ENDPOINT);
    const res = await fetch(OBO_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamsToken }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(
        `OBO HTTP ${res.status}: ${errBody?.error ?? "unknown"} — ${JSON.stringify(errBody?.details ?? {})}`
      );
    }

    oboResult = await res.json();
    console.log("[TeamsAuth] ✅ Step 3 — OBO exchange succeeded");
  } catch (err) {
    const finalErr = new Error(
      `Teams OBO exchange failed: ${err.message}. ` +
      `Ensure /teamsauth/obo-exchange is reachable from Teams and ` +
      `AZURE_CLIENT_SECRET is set correctly on the backend.`
    );
    finalErr.debugInfo = {
      failedAt: "step3_oboExchange",
      error: err.message,
      oboEndpoint: OBO_ENDPOINT,
      loginHint,
      tenantId,
      localAccountId,
      origin: typeof window !== "undefined" ? window.location.origin : "unknown",
      clientId: msalInstance.getConfiguration?.()?.auth?.clientId ?? "unknown",
      time: new Date().toISOString(),
    };
    throw finalErr;
  }

  // ── Step 4: Store OBO token ───────────────────────────────────────────────
  const expiresAt = Date.now() + (oboResult.expiresIn ?? 3600) * 1000;
  sessionStorage.setItem("teams_obo_token", oboResult.accessToken);
  sessionStorage.setItem("teams_obo_expires_at", String(expiresAt));
  sessionStorage.setItem("teams_login_hint", loginHint);
  console.log("[TeamsAuth] Step 4 — OBO token stored in sessionStorage");

  // ── Step 5: Best-effort acquireTokenSilent ────────────────────────────────
  // Works when MSAL already has a refresh token (e.g. Teams mobile, re-auth).
  // Expected to fail on Teams desktop — caught silently, OBO token covers us.
  const tenantAuthority = `https://login.microsoftonline.com/${tenantId}`;
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
    const silentResult = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: syntheticAccount,
      authority: tenantAuthority,
      forceRefresh: false,
    });
    msalInstance.setActiveAccount(silentResult.account);
    console.log(
      "[TeamsAuth] ✅ Step 5 — acquireTokenSilent succeeded:",
      silentResult.account?.username
    );
  } catch (silentErr) {
    // Expected on Teams desktop — silently continue
    console.log(
      "[TeamsAuth] Step 5 — acquireTokenSilent failed (expected on Teams desktop):",
      silentErr?.errorCode ?? silentErr?.message
    );
  }

  // ── Step 6: Set auth flags for AuthGuard ──────────────────────────────────
  sessionStorage.setItem("teams_authenticated", "1");
  sessionStorage.setItem("consent_verified", "1");

  console.log("[TeamsAuth] ✅ bootstrapTeamsMsal complete");
}

// ─── getStoredTeamsToken ──────────────────────────────────────────────────────
// Use this in your API call helpers instead of MSAL acquireTokenSilent
// when running inside Teams desktop (where MSAL silent auth times out).
// Returns null if no valid stored token exists (expired or not set).
export function getStoredTeamsToken() {
  if (typeof window === "undefined") return null;
  const token = sessionStorage.getItem("teams_obo_token");
  const expiresAt = Number(sessionStorage.getItem("teams_obo_expires_at") ?? 0);
  if (!token || Date.now() >= expiresAt) return null;
  return token;
}

// ─── getTeamsAccessToken (one-off OBO helper) ─────────────────────────────────
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