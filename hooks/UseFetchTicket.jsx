import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useFetchTicket({ ticketuuid = '', entrauserid = null, entratenantid = null, refreshKey = 0, enabled = true } = {}) {
  const { instance, accounts } = useMsal();
  const [tickets, setTickets] = useState([]);
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
    if (!enabled) {
      return;
    }

    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        const accessToken = await getAccessToken();

        const params = new URLSearchParams();
        if (ticketuuid)     params.append("ticketuuid",     ticketuuid);
        if (entrauserid)    params.append("entrauserid",    entrauserid);
        if (entratenantid)  params.append("entratenantid",  entratenantid);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets?${params.toString()}`,
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
        console.log("Fetched tickets:", data);
        setTickets(data || []);
      } catch (err) {
        setError(err.message || "Failed to fetch tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [ticketuuid, entrauserid, entratenantid, refreshKey, enabled, getAccessToken]);

  return { tickets, loading, error };
}