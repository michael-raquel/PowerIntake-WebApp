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
  const log = [];
  const push = (level, msg, detail = null) => {
    log.push({ t: new Date().toISOString().slice(11, 23), level, msg, detail });
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`[TeamsAuth] ${msg}`, detail ?? "");
  };

  const fail = (msg) => {
    push("error", msg);
    const e = new Error(msg);
    e.authLog = log;
    return e;
  };

  push("info", "bootstrapTeamsMsal START");

  // Step 1: Get Teams token
  let teamsToken, payload;
  try {
    teamsToken = await getTeamsClientToken();
    payload = _decodeJwt(teamsToken);
    push("info", "Step 1 ✅ Got Teams token", {
      oid: payload?.oid, tid: payload?.tid,
      upn: payload?.preferred_username ?? payload?.upn,
    });
  } catch (err) {
    push("error", "Step 1 ❌ getTeamsClientToken() threw", err.message);
    throw fail(err.message);
  }

  if (!payload) throw fail("Teams token could not be decoded — malformed JWT");

  const loginHint      = payload.preferred_username ?? payload.upn ?? payload.unique_name ?? null;
  const tenantId       = payload.tid ?? null;
  const localAccountId = payload.oid ?? null;
  const homeAccountId  = localAccountId && tenantId ? `${localAccountId}.${tenantId}` : null;

  push("info", "Token claims extracted", { loginHint, tenantId, localAccountId });

  if (!loginHint || !tenantId || !localAccountId) {
    const missing = [!loginHint && "upn/preferred_username", !tenantId && "tid", !localAccountId && "oid"]
      .filter(Boolean).join(", ");
    throw fail(`Teams token is missing required claims: ${missing}`);
  }

  // Step 2: MSAL cache check
  const existing = msalInstance.getAllAccounts();
  const alreadyCached = existing.find((a) => a.localAccountId === localAccountId);
  if (alreadyCached) {
    msalInstance.setActiveAccount(alreadyCached);
    push("info", "Step 2 ✅ Account already in MSAL cache — done");
    return;
  }
  push("info", "Step 2 — No cached account, proceeding to ssoSilent");

  const tenantAuthority = `https://login.microsoftonline.com/${tenantId}`;

  // Step 3: ssoSilent
  try {
    push("info", "Step 3 — Attempting ssoSilent", { loginHint, tenantAuthority });
    await msalInstance.ssoSilent({ ...loginRequest, loginHint, authority: tenantAuthority });
    push("info", "Step 3 ✅ ssoSilent succeeded");
    return;
  } catch (ssoErr) {
    const code = ssoErr?.errorCode ?? ssoErr?.name ?? "unknown";
    push("warn", `Step 3 ⚠️ ssoSilent failed (${code})`, ssoErr?.message);
  }

  // Step 4: acquireTokenSilent fallback
  push("info", "Step 4 — Trying acquireTokenSilent fallback");
  const syntheticAccount = {
    homeAccountId, localAccountId,
    environment: "login.windows.net",
    tenantId, username: loginHint,
    name: payload.name ?? loginHint,
    idTokenClaims: payload,
  };

  try {
    const silentResult = await msalInstance.acquireTokenSilent({
      ...loginRequest, account: syntheticAccount,
      authority: tenantAuthority, forceRefresh: false,
    });
    push("info", "Step 4 ✅ acquireTokenSilent succeeded", silentResult.account?.username);
    msalInstance.setActiveAccount(silentResult.account);
    return;
  } catch (silentErr) {
    const code = silentErr?.errorCode ?? silentErr?.name ?? "unknown";
    push("error", `Step 4 ❌ acquireTokenSilent failed (${code})`, silentErr?.message);
  }

  push("error", "All silent auth strategies exhausted");
  throw fail(
    "Teams silent authentication failed. Both ssoSilent and acquireTokenSilent were unsuccessful. " +
    "Check the Auth trace below for the exact error code."
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