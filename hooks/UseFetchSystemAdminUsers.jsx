import { useState, useEffect, useCallback, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export default function useFetchSuperAdminUsers(initialPage = 1, initialLimit = null) {
  const { instance, accounts } = useMsal();
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(initialPage);
  const [limit, setLimit]           = useState(initialLimit);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totals,     setTotals]     = useState({ totalTickets: 0, openTickets: 0 });
  const lastTotalsKeyRef            = useRef("");
  const limitRef                    = useRef(initialLimit);

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

  const fetchTotals = useCallback(async (filters, totalCount) => {
    if (!totalCount) {
      setTotals({ totalTickets: 0, openTickets: 0 });
      return;
    }

    const params = new URLSearchParams({ page: 1, limit: totalCount });

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
    const rows = json.data || [];
    const totalTickets = rows.reduce(
      (sum, row) => sum + Number(row?.v_totalticket ?? 0),
      0
    );
    const openTickets = rows.reduce(
      (sum, row) => sum + Number(row?.v_openticket ?? 0),
      0
    );

    setTotals({ totalTickets, openTickets });
  }, [getAccessToken, resolveApiUrl]);

  const fetchData = useCallback(async (currentPage = 1, filters = {}) => {
    if (!accounts?.[0]) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: currentPage });

      if (limitRef.current != null) params.append("limit", limitRef.current);

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
      const totalCount = json.total || 0;

      setData(json.data || []);
      setTotal(totalCount);
      setTotalPages(json.totalPages || 1);
      setPage(currentPage);

      const totalsKey = JSON.stringify({ total: totalCount, filters });
      if (totalsKey !== lastTotalsKeyRef.current) {
        lastTotalsKeyRef.current = totalsKey;
        await fetchTotals(filters, totalCount);
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Network error. Check API base URL, CORS, and server availability.");
      } else {
        setError(err?.message || String(err));
      }
      setData([]);
      setTotals({ totalTickets: 0, openTickets: 0 });
    } finally {
      setLoading(false);
    }
  }, [accounts, fetchTotals, getAccessToken, resolveApiUrl]);

  useEffect(() => {
    if (!accounts?.[0]) return;
    if (initialLimit !== limitRef.current) {
      limitRef.current = initialLimit;
      setLimit(initialLimit);
      fetchData(1);
    }
  }, [accounts, initialLimit, fetchData]);

  useEffect(() => {
    if (!accounts?.[0]) return;
    fetchData(1);
  }, [accounts, fetchData]);

  return {
    data,
    loading,
    error,
    page,
    limit,
    total,
    totals,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    fetchData,
  };
}