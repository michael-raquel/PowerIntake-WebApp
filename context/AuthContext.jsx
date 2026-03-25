import { createContext, useContext, useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/lib/msalConfig";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { instance, accounts } = useMsal();
  const account = accounts[0] ?? null;
  const [accessToken, setAccessToken] = useState(null);
  const [tokenInfo, setTokenInfo]     = useState(null);
  const [userInfo, setUserInfo]       = useState(null); 

  useEffect(() => {
    if (!account) return;

    instance
      .acquireTokenSilent({ ...loginRequest, account })
      .then((response) => {
        setAccessToken(response.accessToken);
        setTokenInfo({
          accessToken:  response.accessToken,
          idToken:      response.idToken,
          tokenType:    response.tokenType,
          scopes:       response.scopes,
          expiresOn:    response.expiresOn?.toString(),
          account: {
            name:           response.account.name,
            username:       response.account.username,
            localAccountId: response.account.localAccountId,
            tenantId:       response.account.tenantId,
            environment:    response.account.environment,
            roles:          response.account.idTokenClaims?.roles ?? [],
          },
        });
      })
      .catch((err) => console.error("Silent token acquisition failed:", err));
  }, [account, instance]);

  useEffect(() => {
    if (!tokenInfo?.account?.localAccountId || !tokenInfo?.accessToken) return;

    const fetchUserInfo = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/user-info?entrauserid=${tokenInfo.account.localAccountId}`,
          {
            headers: {
              Authorization: `Bearer ${tokenInfo.accessToken}`,
            },
          }
        );

        if (!res.ok) throw new Error(`Error ${res.status}`);

        const data = await res.json();
        const user = Array.isArray(data) ? data[0] : data;
      
        setUserInfo(user ?? null); 
      } catch (err) {
        console.error("Failed to fetch userInfo:", err);
      }
    };

    fetchUserInfo();
  }, [tokenInfo?.account?.localAccountId]); 

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