import { createContext, useContext, useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
<<<<<<< Updated upstream
=======
import { InteractionStatus } from "@azure/msal-browser";
>>>>>>> Stashed changes
import { loginRequest } from "@/lib/msalConfig";

const AuthContext = createContext(null);
const GRAPH_URL = "https://graph.microsoft.com/v1.0";

export function AuthProvider({ children }) {
  const { instance, accounts } = useMsal();
  const account = accounts[0] ?? null;
  const [accessToken, setAccessToken] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
<<<<<<< Updated upstream
=======
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
>>>>>>> Stashed changes

  useEffect(() => {
    if (!account) return;

    instance
<<<<<<< Updated upstream
      .acquireTokenSilent({ ...loginRequest, account })
      .then((response) => {
        setAccessToken(response.accessToken);
=======
      .acquireTokenSilent({ ...loginRequest, account, forceRefresh: true })
      .then(async (response) => {
        const accessToken = response.accessToken;
        const userId = response.account.localAccountId;
        const entraRoles = response.account.idTokenClaims?.roles ?? [];

        let hasDirectReports = false;
        try {
          const res = await fetch(
            `${GRAPH_URL}/users/${userId}/directReports`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const data = await res.json();
          hasDirectReports = data.value?.length > 0;
        } catch (err) {
          console.warn("Could not fetch direct reports:", err);
        }

        const roles = hasDirectReports
          ? [...new Set([...entraRoles, "Manager"])]
          : entraRoles;

        setAccessToken(accessToken);
>>>>>>> Stashed changes
        setTokenInfo({
          accessToken,
          idToken: response.idToken,
          tokenType: response.tokenType,
          scopes: response.scopes,
          expiresOn: response.expiresOn?.toString(),
          account: {
            name: response.account.name,
            username: response.account.username,
            localAccountId: response.account.localAccountId,
            tenantId: response.account.tenantId,
            environment: response.account.environment,
            roles,
            hasDirectReports,
          },
        });
      })
<<<<<<< Updated upstream
      .catch((err) => console.error("Silent token acquisition failed:", err));
  }, [account, instance]);
=======
      .catch((err) => {
        if (err.errorCode === "uninitialized_public_client_application") {
          setError("uninitialized");
          return;
        }
        console.error("Silent token acquisition failed:", err);
      })
      .finally(() => setLoading(false));
  }, [account, instance, inProgress]);
>>>>>>> Stashed changes

  return (
    <AuthContext.Provider value={{ account, accessToken, tokenInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}