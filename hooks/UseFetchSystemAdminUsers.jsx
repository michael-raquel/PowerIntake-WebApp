import { useState, useEffect, useCallback, useRef } from "react";

export default function useFetchSuperAdminUsers(initialPage = 1, initialLimit = 12, refetch) {
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(initialPage);
  const [limit]                     = useState(initialLimit);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const lastArgsRef = useRef({ page: initialPage, filters: {} });

  const fetchData = useCallback(async (currentPage = initialPage, filters = {}) => {
    setLoading(true);
    setError(null);

    lastArgsRef.current = { page: currentPage, filters };

    try {
      const accessToken = await getAccessToken();

      const params = new URLSearchParams({ page: currentPage, limit });

      if (filters.search)     params.append("search",     filters.search);
      if (filters.clientname) params.append("clientname", filters.clientname);
      if (filters.role)       params.append("role",       filters.role);
      if (filters.status)     params.append("status",     filters.status);

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/superadmin?${params}`;

      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${body}`);
      }

      const json = await res.json();
      setData(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
      setPage(currentPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [initialPage, limit]);

  useEffect(() => {
    fetchData(initialPage);
  }, [fetchData, initialPage]);

  return {
    data,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    fetchData,
    refetch,
  };
}