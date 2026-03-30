import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useReactivateTicket() {
  const { instance, accounts } = useMsal();
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

  const reactivateTicket = useCallback(async ({ ticketuuid }) => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getAccessToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/reactivate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ ticketuuid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reactivate ticket");
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  return { reactivateTicket, loading, error };
}