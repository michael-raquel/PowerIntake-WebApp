import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

const appendListParam = (params, key, value) => {
  if (Array.isArray(value)) {
    if (value.length > 0) params.append(key, value.join(","));
    return;
  }
  if (value) params.append(key, value);
};

export default function useFetchMyTeam(initialPage = 1, initialLimit = null) {
  const { tokenInfo }              = useAuth();
  const { instance, accounts }     = useMsal();
  const [data,       setData]      = useState([]);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState(null);
  const [page,       setPage]      = useState(initialPage);
  const [limit, setLimit]          = useState(initialLimit);
  const [total,      setTotal]     = useState(0);
  const [totalPages, setTotalPages]= useState(1);
  const [totals,     setTotals]    = useState({ totalTickets: 0, openTickets: 0 });
  const filterOptions = {
    statuses: ["true", "false"],
  };
  const lastTotalsKeyRef           = useRef("");
  const limitRef                   = useRef(initialLimit);

  const entrauserid = tokenInfo?.account?.localAccountId;

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  const fetchTotals = useCallback(async (filters, totalCount) => {
    if (!entrauserid || !totalCount) {
      setTotals({ totalTickets: 0, openTickets: 0 });
      return;
    }

    const accessToken = await getAccessToken();

    const params = new URLSearchParams({
      entrauserid,
      page: 1,
      limit: totalCount,
    });

    if (filters.search) params.append("search", filters.search);
    appendListParam(params, "status", filters.status);

    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/myteam?${params}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
  }, [entrauserid, getAccessToken]);

  const fetchData = useCallback(async (currentPage = 1, filters = {}) => {
    if (!entrauserid) return;

    setLoading(true);
    setError(null);
    try {
      const accessToken = await getAccessToken();

      const params = new URLSearchParams({
        entrauserid,
        page:  currentPage,
      });

      if (limitRef.current != null) params.append("limit", limitRef.current);

      if (filters.search) params.append("search", filters.search);
      appendListParam(params, "status", filters.status);

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/myteam?${params}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${body}`);
      }

      const json = await res.json();
      const totalCount = json.total || 0;

      setData(json.data);
      setTotal(totalCount);
      setTotalPages(json.totalPages);
      setPage(currentPage);

      const totalsKey = JSON.stringify({ total: totalCount, filters, entrauserid });
      if (totalsKey !== lastTotalsKeyRef.current) {
        lastTotalsKeyRef.current = totalsKey;
        await fetchTotals(filters, totalCount);
      }
    } catch (err) {
      setError(err.message);
      setTotals({ totalTickets: 0, openTickets: 0 });
    } finally {
      setLoading(false);
    }
  }, [entrauserid, fetchTotals, getAccessToken]);

  useEffect(() => {
    if (initialLimit !== limitRef.current) {
      limitRef.current = initialLimit;
      setLimit(initialLimit);
      fetchData(1);
    }
  }, [initialLimit, fetchData]);

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
    totals,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    fetchData,
    filterOptions,
  };
}