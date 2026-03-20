import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export default function useFetchSuperAdminUsers(initialPage = 1, initialLimit = 12) {
  const { instance, accounts } = useMsal();
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(initialPage);
  const [limit]                     = useState(initialLimit);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const resolveApiUrl = useCallback((path) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!baseUrl) {
      if (typeof window !== "undefined") {
        return new URL(path, window.location.origin).toString();
      }
      throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
    }

    return new URL(path, baseUrl).toString();
  }, []);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  const fetchData = useCallback(async (currentPage = 1, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: currentPage, limit });

      if (filters.search)     params.append("search",     filters.search);
      if (filters.clientname) params.append("clientname", filters.clientname);
      if (filters.role)       params.append("role",       filters.role);
      if (filters.status)     params.append("status",     filters.status);

      const accessToken = await getAccessToken();
      const url = resolveApiUrl(`/manageusers/superadmin?${params}`);

      const res = await fetch(url, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${body}`);
      }

      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
      setPage(currentPage);
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Network error. Check API base URL, CORS, and server availability.");
      } else {
        setError(err?.message || String(err));
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, limit, resolveApiUrl]);

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