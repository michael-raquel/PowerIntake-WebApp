import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useFetchAppRole({
  clientId = null,
  refreshKey = 0,
  endpoint = "/approles",
} = {}) {
  const { instance, accounts } = useMsal();
  const [data, setData] = useState(null);
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

  const fetchData = useCallback(async () => {
    if (!clientId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const accessToken = await getAccessToken();
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}/${clientId}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${body}`);
      }

      const json = await res.json();
      setData(json || null);
    } catch (err) {
      setError(err.message || "Failed to fetch app roles");
    } finally {
      setLoading(false);
    }
  }, [clientId, endpoint, getAccessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
