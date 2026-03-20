import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

const useSyncUsers = () => {
  const { instance, accounts } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  const syncUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const accessToken = await getAccessToken();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/sync`,
        {
          method: "POST",
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${body}`);
      }

      const json = await res.json();
      setResult(json);
    } catch (err) {
      console.error("[useSyncUsers] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  return { syncUsers, loading, error, result };
};

export default useSyncUsers;