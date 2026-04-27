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
 * Directly injects the Teams SSO token into MSAL's localStorage cache,
 * bypassing ssoSilent entirely (which fails in Teams due to cookie blocking).
 *
 * MSAL cache key format (verified from MSAL.js source):
 *   <homeAccountId>-<environment>-<credentialType>-<clientId>-<realm>-<target>
 *
 * After writing the cache, we force MSAL to rescan by calling
 * msalInstance.getAllAccounts() and then setActiveAccount().
 */
export async function bootstrapTeamsMsal(msalInstance, loginRequest) {
  // ── 1. Get Teams token — always silent, always works in Teams ──
  const teamsToken = await getTeamsClientToken();

  // ── 2. Decode claims ────────────────────────────────────────────
  const payload = JSON.parse(atob(teamsToken.split(".")[1]));
console.log("[TeamsBootstrap] token claims:", {
  upn: payload.preferred_username,
  oid: payload.oid,
  tid: payload.tid,
  aud: payload.aud,
  exp: new Date(payload.exp * 1000).toISOString(),
});

  const username       = payload.preferred_username ?? payload.upn ?? payload.unique_name ?? "";
  const name           = payload.name ?? username;
  const tenantId       = payload.tid ?? "";
  const oid            = payload.oid ?? "";

  if (!username || !tenantId || !oid) {
    throw new Error(
      `Teams token missing claims — upn:"${username}" tid:"${tenantId}" oid:"${oid}"`
    );
  }

  const homeAccountId  = `${oid}.${tenantId}`;
  const localAccountId = oid;
  const environment    = "login.windows.net";
  const clientId       = msalInstance.config.auth.clientId;
  const realm          = tenantId;

  // ── 3. If MSAL already has this account, just activate it ───────
  const cached = msalInstance.getAllAccounts().find(
    (a) => a.localAccountId === localAccountId
  );
  if (cached) {
    msalInstance.setActiveAccount(cached);
    return;
  }

  // ── 4. Build clientInfo (base64url of {"uid":"oid","utid":"tid"}) ─
  const clientInfo = btoa(
    JSON.stringify({ uid: oid, utid: tenantId })
  ).replace(/=/g, "");

  // ── 5. Write MSAL account entity ────────────────────────────────
  // Key: <homeAccountId>-<environment>-<realm>
  const accountCacheKey = `${homeAccountId}-${environment}-${realm}`;
  const accountEntity = {
    homeAccountId,
    environment,
    realm,
    localAccountId,
    username,
    name,
    authorityType: "MSSTS",
    clientInfo,
    tenantProfiles: {},
  };
  localStorage.setItem(accountCacheKey, JSON.stringify(accountEntity));

  // ── 6. Write ID token entity ─────────────────────────────────────
  // Key: <homeAccountId>-<environment>-idtoken-<clientId>-<realm>--
  const idTokenCacheKey = `${homeAccountId}-${environment}-idtoken-${clientId}-${realm}--`;
  const idTokenEntity = {
    homeAccountId,
    environment,
    credentialType: "IdToken",
    clientId,
    realm,
    secret:         teamsToken,
  };
  localStorage.setItem(idTokenCacheKey, JSON.stringify(idTokenEntity));

  // ── 7. Write access token entity ─────────────────────────────────
  // Key: <homeAccountId>-<environment>-accesstoken-<clientId>-<realm>-<scopes>--
  const scopes      = [...(loginRequest.scopes ?? ["openid", "profile", "User.Read"])].sort().join(" ");
  const expiresOn   = String(payload.exp ?? Math.floor(Date.now() / 1000) + 3600);
  const cachedAt    = String(Math.floor(Date.now() / 1000));
  const extExpires  = String(Number(expiresOn) + 86400);

  const accessTokenCacheKey = `${homeAccountId}-${environment}-accesstoken-${clientId}-${realm}-${scopes}--`;
  const accessTokenEntity = {
    homeAccountId,
    environment,
    credentialType:    "AccessToken",
    clientId,
    realm,
    target:            scopes,
    secret:            teamsToken,
    cachedAt,
    expiresOn,
    extendedExpiresOn: extExpires,
    tokenType:         "Bearer",
  };
  localStorage.setItem(accessTokenCacheKey, JSON.stringify(accessTokenEntity));

  // ── 8. Force MSAL to rescan its cache ────────────────────────────
  // MSAL reads localStorage on getAllAccounts() — after the writes above
  // it should find the injected account.
  await new Promise((r) => setTimeout(r, 50)); // let MSAL's storage event settle

  const injected = msalInstance.getAllAccounts().find(
    (a) => a.localAccountId === localAccountId
  );

  if (injected) {
    msalInstance.setActiveAccount(injected);
    return;
  }

  // ── 9. Last resort: try ssoSilent with tenant authority ──────────
  // Some Teams environments DO have the session cookie. Try once more
  // now that we know the exact tenant.
  try {
    await msalInstance.ssoSilent({
      loginHint: username,
      scopes:    loginRequest.scopes,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    });
  } catch (err) {
    throw new Error(
      `Teams SSO cache injection failed and ssoSilent also failed (${err.errorCode ?? err.message}). ` +
      `Verify the app is registered in tenant ${tenantId} and admin consent is granted.`
    );
  }
}

export async function getTeamsAccessToken(oboEndpoint) {
  const teamsToken = await getTeamsClientToken();
  const res = await fetch(oboEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamsToken }),
  });
  if (!res.ok) throw new Error(`OBO exchange failed: ${res.status} ${await res.text()}`);
  return res.json();
}