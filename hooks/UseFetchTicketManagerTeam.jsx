import { useState, useEffect } from "react";

export function useFetchTicketManagerTeam({ managerid = null, refreshKey = 0 } = {}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (managerid) params.append("managerid", managerid);

        const query = params.toString();
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/manager-team${query ? `?${query}` : ""}`;

        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const data = await res.json();
        console.log("Fetched manager team tickets:", data);
        const flatTickets = (data?.team || []).flatMap((member) =>
          (member.tickets || []).map((ticket) => ({
            ...ticket,
            v_teammembername: member.user,
            v_teammemberentrauserid: member.entrauserid,
          }))
        );

        setTickets(flatTickets);
      } catch (err) {
        setError(err.message || "Failed to fetch manager team tickets");
      } finally {
        setLoading(false);
      }
    };

    if (!managerid) {
      setTickets([]);
      return;
    }

    fetchTeamTickets();
  }, [managerid, refreshKey]);

  return { tickets, loading, error };
}