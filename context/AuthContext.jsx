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

// Build a tokenInfo-shaped object from a raw OBO/Teams token
// so the rest of the app (login-sync, socket join, etc.) works identically.
function buildTeamsTokenInfo(token) {
  const claims = decodeJwt(token);
  if (!claims) return null;
  return {
    accessToken: token,
    idToken: token, // OBO token serves as both in Teams desktop path
    expiresOn: claims.exp ? new Date(claims.exp * 1000).toString() : null,
    scopes: ["User.Read"],
    account: {
      name:           claims.name           ?? claims.preferred_username ?? "",
      username:       claims.preferred_username ?? claims.upn ?? "",
      localAccountId: claims.oid            ?? "",
      tenantId:       claims.tid            ?? "",
      environment:    "login.windows.net",
      roles:          claims.roles          ?? [],
    },
  };
}

export function AuthProvider({ children }) {
  const { instance, accounts } = useMsal();
  const account = accounts[0] ?? null;

  const [accessToken, setAccessToken]         = useState(null);
  const [tokenInfo, setTokenInfo]             = useState(null);
  const [userInfo, setUserInfo]               = useState(null);
  const [isGlobalAdmin, setIsGlobalAdmin]     = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);

  const logoutIntervalRef  = useRef(null);
  const logoutToastIdRef   = useRef(null);

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
    const message = (v) => `Your account was updated. You will be logged out in ${v}s.`;

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

  // ── Profile photo (MSAL path only — Teams OBO token has Graph User.Read) ──
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

  // ── Token acquisition ──────────────────────────────────────────────────────
  // Path A: MSAL account present (browser / Teams mobile after ssoSilent)
  // Path B: No MSAL account but Teams OBO token in sessionStorage (Teams desktop)
  useEffect(() => {
    const teamsOboToken = getStoredTeamsToken();

    // ── Path B: Teams desktop OBO ─────────────────────────────────────────
    if (!account && teamsOboToken) {
      console.log("[AuthContext] No MSAL account — using Teams OBO token");
      const info = buildTeamsTokenInfo(teamsOboToken);
      if (info) {
        setAccessToken(teamsOboToken);
        setTokenInfo(info);
      }
      return;
    }

    // ── Path A: Normal MSAL flow ──────────────────────────────────────────
    if (!account) return;

    const acquire = async () => {
      try {
        const response = await instance.acquireTokenSilent({ ...apiRequest, account });
        const token    = response.accessToken;
        const claims   = decodeJwt(token);
        const expectedAud = msalConfig.auth.clientId;

        if (claims?.aud !== expectedAud && claims?.aud !== `api://${expectedAud}`) return;

        setAccessToken(token);
        setTokenInfo({
          accessToken: token,
          idToken:     response.idToken,
          expiresOn:   response.expiresOn?.toString(),
          scopes:      response.scopes,
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
            const claims   = decodeJwt(token);

            setAccessToken(token);
            setTokenInfo({
              accessToken: token,
              idToken:     response.idToken,
              expiresOn:   response.expiresOn?.toString(),
              scopes:      response.scopes,
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
            // popup failed — user may need to re-auth
          }
        }
      }
    };

    acquire();
  }, [account, instance]);

  // ── Global admin check (MSAL path only) ───────────────────────────────────
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
          { headers: { Authorization: `Bearer ${graphRes.accessToken}` } }
        );

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          setIsGlobalAdmin(
            (rolesData.value ?? []).some((r) => r.roleTemplateId === GLOBAL_ADMIN_WID)
          );
        } else {
          setIsGlobalAdmin(false);
        }
      } catch {
        setIsGlobalAdmin(false);
      }
    };

    checkGlobalAdmin();
  }, [account, instance]);

  // ── Login sync ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !tokenInfo) return;

    const syncUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/login-sync`,
          { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (res.status === 403) return; // tenant not registered — AuthGuard handles redirect

        if (!res.ok) return;

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
        // network error — non-fatal
      }
    };

    syncUser();
  }, [accessToken, tokenInfo]);

  // ── Socket reconnect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!tokenInfo?.account?.localAccountId) return;

    const handleReconnect = () => {
      socket.emit("join", tokenInfo.account.localAccountId);
      if (tokenInfo?.account?.tenantId) {
        socket.emit("join", tokenInfo.account.tenantId);
      }
    };

    socket.on("connect", handleReconnect);
    return () => socket.off("connect", handleReconnect);
  }, [tokenInfo?.account?.localAccountId, tokenInfo?.account?.tenantId]);

  // ── Socket error logging ───────────────────────────────────────────────────
  useEffect(() => {
    const onDisconnect   = (reason) => console.log("[WS] disconnected:", reason);
    const onConnectError = (err)    => console.error("[WS] connect_error:", err.message);

    socket.on("disconnect",    onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("disconnect",    onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  // ── Role changed → countdown logout ───────────────────────────────────────
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
      if (logoutIntervalRef.current) {
        clearInterval(logoutIntervalRef.current);
        logoutIntervalRef.current = null;
      }
      if (logoutToastIdRef.current) {
        toast.dismiss(logoutToastIdRef.current);
        logoutToastIdRef.current = null;
      }
    };
  }, [tokenInfo?.account?.localAccountId, startLogoutCountdown]);

  // ── Logout cleanup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!account) {
      // Only disconnect socket if also no Teams OBO token
      const teamsOboToken = getStoredTeamsToken();
      if (!teamsOboToken) {
        socket.disconnect();
        sessionStorage.removeItem("consent_verified");
        sessionStorage.removeItem("teams_authenticated");
        sessionStorage.removeItem("teams_obo_token");
        sessionStorage.removeItem("teams_obo_expires_at");
        sessionStorage.removeItem("teams_login_hint");
      }
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