import { createContext, useContext, useState, useEffect, useRef } from "react";
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
  // This tells us if the logged-in user is a Global Admin in their Azure AD tenant.
  // It does NOT determine consent — consent is checked via the DB in AuthGuard.
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

        console.log("[AUTH] Graph wids:", wids);
        setIsGlobalAdmin(wids.includes(GLOBAL_ADMIN_WID));

      } catch (err) {
        // This is expected for tenants that haven't consented yet.
        // isGlobalAdmin stays false — AuthGuard handles the redirect.
        console.warn("[AUTH] Could not get Graph token (expected for unconsented tenants):", err.errorCode ?? err.message);
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

        // 403 = tenant not in DB yet (expected for new/unconsented tenants)
        // AuthGuard will handle redirecting them. Don't treat as fatal.
        if (res.status === 403) {
          console.warn("[LOGIN SYNC] Tenant not registered — skipping sync, AuthGuard will redirect.");
          return;
        }

        if (!res.ok) {
          console.warn("[AUTH] login-sync failed:", res.status);
          
        } else {
          const data = await res.json();
          setUserInfo(data.user ?? null);
        }

        const entrauserid   = tokenInfo.account.localAccountId;
        const entratenantid = tokenInfo.account.tenantId;

        const joinRooms = () => {
          socket.emit("join", entrauserid);
          // console.log("[WS] Joined room:", entrauserid);
          if (entratenantid) {
            socket.emit("join", entratenantid);
            // console.log("[WS] Joined tenant room:", entratenantid);
          }
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

  useEffect(() => {
    if (!tokenInfo?.account?.localAccountId) return;

    const handleReconnect = () => {
      console.log("[WS] Reconnected — re-joining rooms");
      socket.emit("join", tokenInfo.account.localAccountId);
      if (tokenInfo?.account?.tenantId) {
        socket.emit("join", tokenInfo.account.tenantId);
      }
    };

    socket.on("connect", handleReconnect);
    return () => socket.off("connect", handleReconnect);
  }, [tokenInfo?.account?.localAccountId, tokenInfo?.account?.tenantId]);

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

  useEffect(() => {
    if (!account) {
      socket.disconnect();
      console.log("[WS] Disconnected on logout");
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