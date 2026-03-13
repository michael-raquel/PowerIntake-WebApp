import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useFetchNote(ticketuuid = null, noteuuid = null) {
  const { instance, accounts } = useMsal();
  const [notes, setNotes] = useState([]);
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

  const fetchNotes = useCallback(async () => {
    if (!accounts?.[0]) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accessToken = await getAccessToken();

      const params = new URLSearchParams();
      if (noteuuid) params.append("noteuuid", noteuuid);
      if (ticketuuid) params.append("ticketuuid", ticketuuid);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/notes?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }
      );

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch notes");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [accounts, getAccessToken, noteuuid, ticketuuid]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, error, fetchNotes, setNotes };
}