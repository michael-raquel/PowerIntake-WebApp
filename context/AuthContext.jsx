import { createContext, useContext, useState, useEffect } from "react";
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
    if (!accessToken) return;

    const syncUser = async () => {
      try {
        console.log("[AUTH] syncUser running, accessToken present");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/login-sync`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        console.log("[AUTH] login-sync response status:", res.status);

        if (!res.ok) {
          console.warn("[AUTH] login-sync failed:", res.status);
          return;
        }

        const data = await res.json();
        const user = data.user ?? null;
        // console.log("[AUTH] user:", user);
        setUserInfo(user);

        if (user?.entrauserid) {
          if (!socket.connected) socket.connect();

          const joinRooms = () => {
            socket.emit("join", user.entrauserid);
            // console.log("[WS] Joined room:", user.entrauserid);
            if (user?.entratenantid) {
              socket.emit("join", user.entratenantid);
              // console.log("[WS] Joined tenant room:", user.entratenantid);
            }
          };

          if (socket.connected) {
            joinRooms();
          } else {
            socket.once("connect", joinRooms);
          }
        } else {
          console.warn("[WS] No entrauserid on user — skipping socket join");
        }
      } catch (err) {
        console.error("[AUTH] syncUser error:", err);
      }
    };

    syncUser();
  }, [accessToken]);

  useEffect(() => {
    const onConnect      = () => console.log("[WS] socket connected:", socket.id);
    const onDisconnect   = (reason) => console.log("[WS] socket disconnected:", reason);
    const onConnectError = (err) => console.error("[WS] connect_error:", err.message);

    socket.on("connect",       onConnect);
    socket.on("disconnect",    onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect",       onConnect);
      socket.off("disconnect",    onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  useEffect(() => {
    if (!userInfo?.entrauserid) return;

    const handleReconnect = () => {
      console.log("[WS] Reconnected — re-joining rooms");
      socket.emit("join", userInfo.entrauserid);
      if (userInfo?.entratenantid) {
        socket.emit("join", userInfo.entratenantid);
      }
    };

    socket.on("connect", handleReconnect);
    return () => socket.off("connect", handleReconnect);
  }, [userInfo?.entrauserid, userInfo?.entratenantid]);

  useEffect(() => {
    if (!account) {
      socket.disconnect();
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