import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useFetchTeamTickets({ managerid = null, refreshKey = 0 } = {}) {
  const { instance, accounts } = useMsal();
  const [teamTickets, setTeamTickets] = useState([]);
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
    if (!managerid) {
      setTeamTickets([]);
      return;
    }

    const fetchTeamTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/manager-team?managerid=${managerid}`;
        const accessToken = await getAccessToken();
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const data = await res.json();
        const flattened = (data.team || []).flatMap(
          (member) => member.tickets || [],
        );
        setTeamTickets(flattened);
      } catch (err) {
        setError(err.message || "Failed to fetch team tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTeamTickets();
  }, [getAccessToken, managerid, refreshKey]);

  return { teamTickets, loading, error };
}
