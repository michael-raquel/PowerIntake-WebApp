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
            console.error("Token popup failed:", popupErr);
          }
        } else {
          console.error("Token acquisition failed:", err);
        }
      }
    };

    acquire();
  }, [account, instance]);

  useEffect(() => {
    if (!accessToken) return;

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
          const err = await res.json();
          console.error("Login sync failed:", err);
          return;
        }

        const data = await res.json();
        const user = data.user ?? null;
        setUserInfo(user);

        if (user?.v_entrauserid) {
          socket.connect();
          socket.emit("join", user.v_entrauserid);
          console.log("[WS] Joined room:", user.v_entrauserid);
        }

      } catch (err) {
        console.error("Failed to sync user on login:", err);
      }
    };

    syncUser();
  }, [accessToken]);

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