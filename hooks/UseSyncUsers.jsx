import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

const useSyncUsers = () => {
  const { instance, accounts } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const resolveApiUrl = useCallback((path) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!baseUrl) {
      if (typeof window !== "undefined") {
        return new URL(path, window.location.origin).toString();
      }
      throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
    }

    return new URL(path, baseUrl).toString();
  }, []);

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

      const url = resolveApiUrl("/users/sync");

      const res = await fetch(url, {
        method: "POST",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${body}`);
      }

      const json = await res.json();
      setResult(json);
    } catch (err) {
      // console.error("[useSyncUsers] Error:", err);

      if (err instanceof TypeError) {
        setError("Network error. Check API base URL, CORS, and server availability.");
      } else {
        setError(err?.message || String(err));
      }
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, resolveApiUrl]);

  return { syncUsers, loading, error, result };
};

export default useSyncUsers;