import { createContext, useContext, useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest, msalConfig } from "@/lib/msalConfig";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import socket from "@/lib/socket";

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

  const [accessToken, setAccessToken]     = useState(null);
  const [tokenInfo, setTokenInfo]         = useState(null);
  const [userInfo, setUserInfo]           = useState(null);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  // ── Your API token ──────────────────────────────────────
  useEffect(() => {
    if (!account) return;

    const acquire = async () => {
      try {
        const response    = await instance.acquireTokenSilent({ ...apiRequest, account });
        const token       = response.accessToken;
        const claims      = decodeJwt(token);
        const expectedAud = msalConfig.auth.clientId;

        if (claims?.aud !== expectedAud && claims?.aud !== `api://${expectedAud}`) {
          console.error("[TOKEN] Wrong token — aud:", claims?.aud);
          return;
        }

        setAccessToken(token);
        setTokenInfo({
          accessToken: token,
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
          } catch (popupErr) {
            console.error("[TOKEN] Popup failed:", popupErr);
          }
        } else {
          console.error("[TOKEN] Acquisition failed:", err);
        }
      }
    };

    acquire();
  }, [account, instance]);

  // ── Graph token — only for wids / Global Admin check ────
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

        setIsGlobalAdmin(wids.includes(GLOBAL_ADMIN_WID));
      } catch (err) {
        console.warn("[AUTH] Could not get Graph token:", err.errorCode ?? err.message);
        setIsGlobalAdmin(false);
      }
    };

    checkGlobalAdmin();
  }, [account, instance]);

  // ── Login sync ───────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !tokenInfo) return;

    const syncUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/login-sync`,
          { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } },
        );

        // 403 = tenant not registered — AuthGuard handles redirect
        if (res.status === 403) {
          console.warn("[LOGIN SYNC] Tenant not registered — AuthGuard will redirect.");
          return;
        }

        // Any other non-2xx — log and bail, don't cascade into res.json()
        if (!res.ok) {
          console.warn("[LOGIN SYNC] Skipping sync — server returned:", res.status);
          return;
        }

        const data = await res.json();
        setUserInfo(data.user ?? null);

        // Socket join only runs on successful sync
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

      } catch (err) {
        console.error("[AUTH] syncUser error:", err);
      }
    };

    syncUser();
  }, [accessToken, tokenInfo]);

  // ── Reconnect handler ────────────────────────────────────
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

  // ── Socket error logging ─────────────────────────────────
  useEffect(() => {
    const onDisconnect   = (reason) => console.log("[WS] socket disconnected:", reason);
    const onConnectError = (err)    => console.error("[WS] connect_error:", err.message);

    socket.on("disconnect",    onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("disconnect",    onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  // ── Logout ───────────────────────────────────────────────
  useEffect(() => {
    if (!account) {
      socket.disconnect();
    }
  }, [account]);

  return (
    <AuthContext.Provider value={{
      account,
      accessToken,
      tokenInfo,
      userInfo,
      isGlobalAdmin,
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