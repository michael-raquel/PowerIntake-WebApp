import { useState, useEffect } from "react";

export function useFetchTeamTickets({ managerid = null, refreshKey = 0 } = {}) {
  const [teamTickets, setTeamTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const data = await res.json();
        const flattened = (data.team || []).flatMap(member => member.tickets || []);
        setTeamTickets(flattened);
      } catch (err) {
        setError(err.message || "Failed to fetch team tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTeamTickets();
  }, [managerid, refreshKey]);

  return { teamTickets, loading, error };
}