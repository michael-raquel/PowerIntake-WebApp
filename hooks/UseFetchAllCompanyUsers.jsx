import { useState, useEffect, useCallback } from "react";

export default function useFetchAllCompanyUsers(initialPage = 1, initialLimit = 12) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

 const fetchData = useCallback(async (currentPage = 1) => {
  setLoading(true);
  setError(null);
  try {
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/mycompany?page=${currentPage}&limit=${limit}`;
    console.log('[useFetchAllCompanyUsers] Fetching:', url);

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
    console.error('[useFetchAllCompanyUsers] Error:', err); 
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [limit]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

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
  };
}