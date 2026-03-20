import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export default function useManagerCheck() {
  const { tokenInfo } = useAuth();
  const { instance, accounts } = useMsal();
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  useEffect(() => {
    const entrauserid = tokenInfo?.account?.localAccountId;
    if (!entrauserid) return;

    const check = async () => {
      setLoading(true);
      setError(null);
      try {
        const accessToken = await getAccessToken();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/managercheck?entrauserid=${entrauserid}`,
          {
            headers: {
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
          },
        );

        if (!res.ok) {
          const body = await res.text();
          throw new Error(`${res.status} ${res.statusText} — ${body}`);
        }

        const json = await res.json();

        const result =
          json.user_manager_check ?? json.v_ismanager ?? json ?? false;
        setIsManager(Boolean(result));
      } catch (err) {
        console.error("[useManagerCheck] Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [getAccessToken, tokenInfo?.account?.localAccountId]);

  return { isManager, loading, error };
}
