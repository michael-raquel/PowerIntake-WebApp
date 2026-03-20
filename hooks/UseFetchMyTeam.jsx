import { useState, useEffect, useCallback } from "react";

export function useFetchMyTeamUsers({ managerentrauserid = null, status = null, refreshKey = 0 } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!managerentrauserid) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ managerentrauserid });
      if (status) params.append("status", status);

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/manager?${params}`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${body}`);
      }
      const json = await res.json();
      setData(json || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [managerentrauserid, status]);

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