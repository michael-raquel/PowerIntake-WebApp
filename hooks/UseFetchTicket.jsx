import { useState, useEffect } from "react";

export function useFetchTicket({ ticketuuid = '', entrauserid = null, entratenantid = null, refreshKey = 0 } = {}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (ticketuuid) params.append("ticketuuid", ticketuuid);
        if (entrauserid) params.append("entrauserid", entrauserid);
        if (entratenantid) params.append("entratenantid", entratenantid);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets?${params.toString()}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const data = await res.json();
        setTickets(data || []);
      } catch (err) {
        setError(err.message || "Failed to fetch tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [ticketuuid, entrauserid, entratenantid, refreshKey]);

  return { tickets, loading, error };
}