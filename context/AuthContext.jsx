import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest, msalConfig } from "@/lib/msalConfig";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { getStoredTeamsToken } from "@/lib/teamsAuth";
import socket from "@/lib/socket";
import { toast } from "sonner";

const AuthContext = createContext(null);

const GLOBAL_ADMIN_WID = "62e90394-69f5-4237-9190-012177145e10";

function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const { instance, accounts } = useMsal();
  const account = accounts[0] ?? null;

  const [accessToken, setAccessToken]         = useState(null);
  const [tokenInfo, setTokenInfo]             = useState(null);
  const [userInfo, setUserInfo]               = useState(null);
  const [isGlobalAdmin, setIsGlobalAdmin]     = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);

  const logoutIntervalRef = useRef(null);
  const logoutToastIdRef  = useRef(null);

  const startLogoutCountdown = useCallback((seconds = 10) => {
    if (logoutIntervalRef.current) {
      clearInterval(logoutIntervalRef.current);
      logoutIntervalRef.current = null;
    }
    if (logoutToastIdRef.current) {
      toast.dismiss(logoutToastIdRef.current);
      logoutToastIdRef.current = null;
    }

    let remaining = Math.max(1, Number(seconds) || 10);
    const message = (value) =>
      `Your account was updated. You will be logged out in ${value}s.`;

    logoutToastIdRef.current = toast.warning(message(remaining), { duration: Infinity });

    logoutIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(logoutIntervalRef.current);
        logoutIntervalRef.current = null;
        toast.dismiss(logoutToastIdRef.current);
        logoutToastIdRef.current = null;
        instance.logoutRedirect({ postLogoutRedirectUri: "/" });
        return;
      }
      toast.warning(message(remaining), {
        id: logoutToastIdRef.current,
        duration: Infinity,
      });
    }, 1000);
  }, [instance]);

  // ── Profile photo ─────────────────────────────────────────────────────────
  // Only runs when MSAL has an account (browser + Teams mobile).
  // Teams desktop skips this because account is null — no Graph token available.
  const fetchProfilePhoto = useCallback(async () => {
    if (!account) return null;

    try {
      const graphRes = await instance.acquireTokenSilent({
        scopes: ["User.Read"],
        account,
      });

      const photoRes = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
        headers: { Authorization: `Bearer ${graphRes.accessToken}` },
      });

      if (photoRes.status === 404) return null;
      if (!photoRes.ok) throw new Error("Graph photo request failed");

      const blob = await photoRes.blob();
      const url  = URL.createObjectURL(blob);
      setProfilePhotoUrl(url);
      return url;
    } catch {
      return null;
    }
  }, [account, instance]);

  useEffect(() => { fetchProfilePhoto(); }, [fetchProfilePhoto]);

  useEffect(() => {
    return () => { if (profilePhotoUrl) URL.revokeObjectURL(profilePhotoUrl); };
  }, [profilePhotoUrl]);

  // ── API access token ──────────────────────────────────────────────────────
  useEffect(() => {
    // ── Teams desktop path (no MSAL account in cache) ─────────────────────
    // On Teams desktop, acquireTokenSilent is blocked by the sandbox iframe
    // restrictions, so MSAL never populates accounts[]. bootstrapTeamsMsal
    // stores the OBO token in sessionStorage instead — read it directly here.
    //
    // After the backend fix, this token now has aud = your API client ID
    // (not graph.microsoft.com), so the audience check below will pass and
    // tokenInfo will be populated with the user's real name, UPN, oid, tid.
    if (!account) {
      const storedToken = getStoredTeamsToken();
      if (!storedToken) return;

      const claims = decodeJwt(storedToken);
      if (!claims) return;

      // FIX: Properly validate audience — accept all three valid forms.
      // Previously the condition had a logic bug (!storedToken was always
      // false) AND didn't accept the api:// domain-prefixed form that Azure
      // returns for custom API scopes.
      const expectedAud = msalConfig.auth.clientId;
      const audOk =
        claims.aud === expectedAud ||
        claims.aud === `api://${expectedAud}` ||
        claims.aud === `api://powerintake.spartaserv.com/${expectedAud}`;

      if (!audOk) {
        console.warn(
          "[AUTH] OBO token aud mismatch — got:", claims.aud,
          "expected one of:", expectedAud,
          `| api://${expectedAud}`,
          `| api://powerintake.spartaserv.com/${expectedAud}`,
          "— check that teamsauth.routes.js requests your API scope, not Graph"
        );
        return;
      }

      console.log("[AUTH] Teams desktop — OBO token accepted, aud:", claims.aud,
        "| user:", claims.preferred_username ?? claims.upn);

      setAccessToken(storedToken);
      setTokenInfo({
        accessToken: storedToken,
        idToken: null,
        expiresOn: new Date(
          Number(sessionStorage.getItem("teams_obo_expires_at") ?? 0)
        ).toString(),
        scopes: apiRequest.scopes,
        account: {
          name:           claims.name           ?? sessionStorage.getItem("teams_login_hint") ?? "",
          username:       claims.preferred_username ?? sessionStorage.getItem("teams_login_hint") ?? "",
          localAccountId: claims.oid            ?? "",
          tenantId:       claims.tid            ?? "",
          environment:    "login.windows.net",
          roles:          claims.roles          ?? [],
        },
      });
      return;
    }

    // ── Normal MSAL path (browser + Teams mobile) ──────────────────────────
    const acquire = async () => {
      try {
        const response    = await instance.acquireTokenSilent({ ...apiRequest, account });
        const token       = response.accessToken;
        const idToken     = response.idToken;
        const claims      = decodeJwt(token);
        const expectedAud = msalConfig.auth.clientId;

        if (claims?.aud !== expectedAud && claims?.aud !== `api://${expectedAud}`) {
          console.warn("[AUTH] MSAL token aud mismatch:", claims?.aud);
          return;
        }

        setAccessToken(token);
        setTokenInfo({
          accessToken: token,
          idToken,
          expiresOn: response.expiresOn?.toString(),
          scopes:    response.scopes,
          account: {
            name:           response.account.name,
            username:       response.account.username,
            localAccountId: response.account.localAccountId,
            tenantId:       response.account.tenantId,
            environment:    response.account.environment,
            roles:          claims?.roles ?? [],
          },
        });
      } catch (err) {
        if (err instanceof InteractionRequiredAuthError) {
          try {
            const response = await instance.acquireTokenPopup({ ...apiRequest, account });
            const token    = response.accessToken;
            const idToken  = response.idToken;
            const claims   = decodeJwt(token);

            setAccessToken(token);
            setTokenInfo({
              accessToken: token,
              idToken,
              expiresOn: response.expiresOn?.toString(),
              scopes:    response.scopes,
              account: {
                name:           response.account.name,
                username:       response.account.username,
                localAccountId: response.account.localAccountId,
                tenantId:       response.account.tenantId,
                environment:    response.account.environment,
                roles:          claims?.roles ?? [],
              },
            });
          } catch {
            // Popup blocked or cancelled — silent fail
          }
        } else {
          // Unexpected silent failure — fall back to stored OBO token if
          // present (e.g. Teams mobile session where OBO ran but MSAL also
          // partially succeeded then lost the cache on navigation)
          const storedToken = getStoredTeamsToken();
          if (storedToken) {
            const claims = decodeJwt(storedToken);
            console.log("[AUTH] acquireTokenSilent failed — falling back to OBO token");
            setAccessToken(storedToken);
            setTokenInfo({
              accessToken: storedToken,
              idToken: null,
              expiresOn: new Date(
                Number(sessionStorage.getItem("teams_obo_expires_at") ?? 0)
              ).toString(),
              scopes: apiRequest.scopes,
              account: {
                name:           claims?.name           ?? account.name,
                username:       claims?.preferred_username ?? account.username,
                localAccountId: claims?.oid            ?? account.localAccountId,
                tenantId:       claims?.tid            ?? account.tenantId,
                environment:    "login.windows.net",
                roles:          claims?.roles          ?? [],
              },
            });
          }
        }
      }
    };

    acquire();
  }, [account, instance]);

  // ── Global Admin check ────────────────────────────────────────────────────
  // Skipped on Teams desktop (account is null, no Graph token available).
  // isGlobalAdmin stays false for Teams desktop users — acceptable tradeoff
  // since admin consent flows run in the browser anyway.
  useEffect(() => {
    if (!account) return;

    const checkGlobalAdmin = async () => {
      try {
        const graphRes = await instance.acquireTokenSilent({
          scopes: ["https://graph.microsoft.com/User.Read"],
          account,
        });

        const claims = decodeJwt(graphRes.accessToken);
        const wids   = claims?.wids ?? [];

        if (wids.includes(GLOBAL_ADMIN_WID)) {
          setIsGlobalAdmin(true);
          return;
        }

        const rolesRes = await fetch(
          "https://graph.microsoft.com/v1.0/me/transitiveMemberOf/microsoft.graph.directoryRole?$select=roleTemplateId",
          { headers: { Authorization: `Bearer ${graphRes.accessToken}` } },
        );

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          const isAdmin   = (rolesData.value ?? []).some(
            (r) => r.roleTemplateId === GLOBAL_ADMIN_WID,
          );
          setIsGlobalAdmin(isAdmin);
        } else {
          setIsGlobalAdmin(false);
        }
      } catch {
        setIsGlobalAdmin(false);
      }
    };

    checkGlobalAdmin();
  }, [account, instance]);

  // ── Login sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !tokenInfo) return;

    const syncUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/login-sync`,
          { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } },
        );

        if (res.status === 403) return;
        if (!res.ok)            return;

        const data = await res.json();
        setUserInfo(data.user ?? null);

        const entrauserid   = tokenInfo.account.localAccountId;
        const entratenantid = tokenInfo.account.tenantId;

        const joinRooms = () => {
          socket.emit("join", entrauserid);
          if (entratenantid) socket.emit("join", entratenantid);
        };

        if (!socket.connected) {
          socket.connect();
          socket.once("connect", joinRooms);
        } else {
          joinRooms();
        }
      } catch {
        // Silent fail — non-critical
      }
    };

    syncUser();
  }, [accessToken, tokenInfo]);

  // ── Reconnect handler ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!tokenInfo?.account?.localAccountId) return;

    const handleReconnect = () => {
      socket.emit("join", tokenInfo.account.localAccountId);
      if (tokenInfo?.account?.tenantId) socket.emit("join", tokenInfo.account.tenantId);
    };

    socket.on("connect", handleReconnect);
    return () => socket.off("connect", handleReconnect);
  }, [tokenInfo?.account?.localAccountId, tokenInfo?.account?.tenantId]);

  // ── Socket error logging ──────────────────────────────────────────────────
  useEffect(() => {
    const onDisconnect   = () => {};
    const onConnectError = () => {};
    socket.on("disconnect",    onDisconnect);
    socket.on("connect_error", onConnectError);
    return () => {
      socket.off("disconnect",    onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  // ── Role change → forced logout ───────────────────────────────────────────
  useEffect(() => {
    if (!tokenInfo?.account?.localAccountId) return;

    const onRoleChanged = (payload) => {
      const targetId = payload?.entrauserid;
      if (targetId && targetId !== tokenInfo.account.localAccountId) return;
      startLogoutCountdown(payload?.countdownSeconds ?? 10);
    };

    socket.on("user:role_changed", onRoleChanged);
    return () => {
      socket.off("user:role_changed", onRoleChanged);
      if (logoutIntervalRef.current) clearInterval(logoutIntervalRef.current);
      if (logoutToastIdRef.current)  toast.dismiss(logoutToastIdRef.current);
    };
  }, [tokenInfo?.account?.localAccountId, startLogoutCountdown]);

  // ── Logout cleanup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!account) {
      socket.disconnect();
      sessionStorage.removeItem("consent_verified");
      sessionStorage.removeItem("teams_authenticated");
      sessionStorage.removeItem("teams_obo_token");
      sessionStorage.removeItem("teams_obo_expires_at");
      sessionStorage.removeItem("teams_login_hint");
    }
  }, [account]);

  return (
    <AuthContext.Provider value={{
      account,
      accessToken,
      tokenInfo,
      userInfo,
      isGlobalAdmin,
      profilePhotoUrl,
      fetchProfilePhoto,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}