import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest, msalConfig } from "@/lib/msalConfig";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import socket from "@/lib/socket";

const AuthContext = createContext(null);

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

  const [accessToken, setAccessToken] = useState(null);
  const [tokenInfo, setTokenInfo]     = useState(null);
  const [userInfo, setUserInfo]       = useState(null);

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

  useEffect(() => {
    if (!accessToken || !tokenInfo) return;

    const syncUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/login-sync`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

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
    <AuthContext.Provider value={{ account, accessToken, tokenInfo, userInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}