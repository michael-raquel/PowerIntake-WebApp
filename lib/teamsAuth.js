// teamsAuth.js — Fixed for Teams Store App compatibility
// Key fixes:
//   1. Promise-based getAuthToken (teams-js v2)
//   2. app.initialize() guarded against double-calls
//   3. ssoSilent with fallback to acquireTokenSilent
//   4. Granular error logging for every failure mode
//   5. Cache invalidation flag so slow SDK init isn't permanently cached as false
//   6. API scope included in ssoSilent / acquireTokenSilent calls (Teams SSO requirement)
//   7. notifySuccess() called after successful bootstrap, not in _app.js
//   8. Authorized Teams client IDs documented in checklist

import { apiRequest } from "@/lib/msalConfig";

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
    console.log(
      "[TeamsAuth] ✅ Got Teams token — oid:", payload?.oid,
      "| tid:", payload?.tid,
      "| upn:", payload?.preferred_username ?? payload?.upn
    );
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

// ─── _notifyTeamsSuccess ─────────────────────────────────────────────────────
// Signals to Teams that the app has finished loading.
// Must be called AFTER auth is complete — not in _app.js — so Teams doesn't
// dismiss its loading spinner before the SSO flow resolves.
async function _notifyTeamsSuccess() {
  try {
    const { app } = await import("@microsoft/teams-js");
    app.notifySuccess();
    console.log("[TeamsAuth] ✅ notifySuccess() sent to Teams host");
  } catch (err) {
    // Non-fatal — Teams will time out on its own if this fails
    console.warn("[TeamsAuth] ⚠️ notifySuccess() failed (non-fatal):", err?.message ?? err);
  }
}

// ─── bootstrapTeamsMsal ──────────────────────────────────────────────────────
// Full silent SSO flow with layered fallbacks and detailed logging.
//
// Strategy:
//   1. Get Teams client token (proves user identity to Azure)
//   2. If MSAL already has this account cached → notify Teams + done
//   3. Try ssoSilent with BOTH graph and API scopes (Teams SSO requirement)
//   4. If ssoSilent fails → try acquireTokenSilent with a synthetic account
//      (works when 3rd-party cookies are blocked in Teams Store / Webview2)
//   5. If both fail → throw a descriptive error so the UI can show it
//
// Azure pre-requisites (must all be true or Steps 3/4 will fail):
//   • Expose an API → scope named "access_as_user" exists and is enabled
//   • Expose an API → Authorized client applications includes:
//       1fec8e78-bce4-4aaf-ab1b-5451cc387264  (Teams Web)
//       5e3ce6c0-2b1f-4285-8d4b-75ee78787346  (Teams Desktop)
//       1d18c054-bf13-4bfd-b1fd-dbb7a570e220  (Teams Mobile)
//   • Admin consent granted for the tenant
//   • Optional claims configured: upn, oid, tid (in token config)
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

  console.log(
    "[TeamsAuth] Token claims — loginHint:", loginHint,
    "| tid:", tenantId,
    "| oid:", localAccountId
  );

  if (!loginHint || !tenantId || !localAccountId) {
    const missing = [
      !loginHint      && "upn/preferred_username",
      !tenantId       && "tid",
      !localAccountId && "oid",
    ].filter(Boolean).join(", ");
    throw new Error(
      `Teams token is missing required claims: ${missing}. ` +
      `Check your Azure app registration — ensure "upn", "tid", and "oid" ` +
      `optional claims are configured under Token configuration.`
    );
  }

  // ── Step 2: Check MSAL cache ────────────────────────────────────────────
  const existing      = msalInstance.getAllAccounts();
  const alreadyCached = existing.find((a) => a.localAccountId === localAccountId);

  if (alreadyCached) {
    msalInstance.setActiveAccount(alreadyCached);
    console.log("[TeamsAuth] ✅ Step 2 — Account already in MSAL cache, set as active.");
    await _notifyTeamsSuccess();
    return;
  }

  console.log("[TeamsAuth] No cached account found — proceeding with ssoSilent");

  const tenantAuthority = `https://login.microsoftonline.com/${tenantId}`;

  // ── Merged scopes: graph + API ───────────────────────────────────────────
  // Teams SSO requires the API scope to be present in the ssoSilent request.
  // Without it, Azure issues an ID token only — MSAL won't recognise the
  // account as having consented to your API and will fail on the next
  // acquireTokenSilent call inside the app.
  const mergedScopes = [
    ...new Set([
      ...(loginRequest.scopes ?? []),
      ...(apiRequest.scopes ?? []),
    ]),
  ];

  console.log("[TeamsAuth] Merged scopes for SSO:", mergedScopes);

  // ── Step 3: ssoSilent ───────────────────────────────────────────────────
  let ssoSuccess = false;
  try {
    console.log("[TeamsAuth] Step 3 — Attempting ssoSilent | authority:", tenantAuthority);
    await msalInstance.ssoSilent({
      scopes:    mergedScopes,   // ← was spreading loginRequest only; now includes API scope
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

  if (ssoSuccess) {
    await _notifyTeamsSuccess();
    return;
  }

  // ── Step 4: acquireTokenSilent fallback ─────────────────────────────────
  // Teams Store Webview2 blocks 3rd-party cookies, which breaks ssoSilent's
  // hidden iframe approach. acquireTokenSilent bypasses that by using the
  // MSAL token cache + refresh token directly.
  // We pass a synthetic AccountInfo built from the Teams JWT claims so MSAL
  // can locate (or create) the right cache entry.
  console.log("[TeamsAuth] Step 4 — Trying acquireTokenSilent fallback…");

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
      scopes:       mergedScopes,   // ← same merged scopes as Step 3
      account:      syntheticAccount,
      authority:    tenantAuthority,
      forceRefresh: false,
    });
    console.log(
      "[TeamsAuth] ✅ Step 4 — acquireTokenSilent succeeded, account:",
      silentResult.account?.username
    );
    msalInstance.setActiveAccount(silentResult.account);
    await _notifyTeamsSuccess();
    return;
  } catch (silentErr) {
    const code = silentErr?.errorCode ?? silentErr?.name ?? "unknown";
    const msg  = silentErr?.message ?? String(silentErr);
    console.error(`[TeamsAuth] ❌ Step 4 — acquireTokenSilent failed (${code}): ${msg}`);
    console.error("[TeamsAuth] Full acquireTokenSilent error:", silentErr);
  }

  // ── Both paths failed ────────────────────────────────────────────────────
  console.error("[TeamsAuth] ❌ All silent auth strategies exhausted. Diagnosis checklist:");
  console.error("  1. validDomains in Teams manifest covers your app domain?");
  console.error("  2. api://YOUR_DOMAIN/CLIENT_ID listed in Azure → Expose an API?");
  console.error("  3. Scope named 'access_as_user' exists and is enabled?");
  console.error("  4. Admin consent granted for the tenant?");
  console.error("  5. Authorized client applications includes all three Teams clients:");
  console.error("       Web:     1fec8e78-bce4-4aaf-ab1b-5451cc387264");
  console.error("       Desktop: 5e3ce6c0-2b1f-4285-8d4b-75ee78787346");
  console.error("       Mobile:  1d18c054-bf13-4bfd-b1fd-dbb7a570e220");
  console.error("  6. Optional claims (upn, oid, tid) configured in Token configuration?");
  console.error(`  7. Client ID in use: ${msalInstance.getConfiguration?.()?.auth?.clientId ?? "unknown"}`);
  console.error("  8. MSAL cacheLocation is 'sessionStorage' + storeAuthStateInCookie: true?");

  throw new Error(
    "Teams silent authentication failed. Both ssoSilent and acquireTokenSilent were unsuccessful. " +
    "This usually means: (a) admin consent is missing, (b) the Azure app is not configured for SSO, " +
    "or (c) the Teams app manifest validDomains / webApplicationInfo is misconfigured. " +
    "Check the browser console for detailed logs.\n\n" +
    "Please close and reopen the app in Teams, or contact your administrator."
  );
}

// ─── OBO token exchange ───────────────────────────────────────────────────────
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