import { useState, useEffect, useCallback, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

const appendListParam = (params, key, value) => {
  if (Array.isArray(value)) {
    if (value.length > 0) params.append(key, value.join(","));
    return;
  }
  if (value) params.append(key, value);
};

export default function useFetchMyClients(initialPage = 1, initialLimit = null) {
  const { instance, accounts } = useMsal();
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(initialPage);
  const [limit, setLimit]           = useState(initialLimit);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totals,     setTotals]     = useState({ totalTickets: 0, openTickets: 0, completionRate: 0, newTickets: 0, completedTickets: 0 });
  const filterOptions = {
    tenantnames: [],
    statuses: ["true", "false"],
  };
  const lastTotalsKeyRef            = useRef("");
  const limitRef                    = useRef(initialLimit);

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
      setTotals({ totalTickets: 0, openTickets: 0, completionRate: 0, newTickets: 0, completedTickets: 0 });
      return;
    }

    const accessToken = await getAccessToken();

    const params = new URLSearchParams({ page: 1, limit: totalCount });

    appendListParam(params, "tenantname", filters.tenantname);

    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/myclients?${params}`;

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
    const newTickets = rows.reduce(
      (sum, row) => sum + Number(row?.v_newticket ?? 0),
      0
    );
    const completedTickets = rows.reduce(
      (sum, row) => sum + Number(row?.v_completed ?? 0),
      0
    );
    const completionRate = totalTickets > 0 ? (completedTickets / totalTickets) * 100 : 0;

    setTotals({ totalTickets, openTickets, completionRate, newTickets, completedTickets });
  }, [getAccessToken]);

  const fetchData = useCallback(async (currentPage = 1, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getAccessToken();

      const params = new URLSearchParams({ page: currentPage });

      if (limitRef.current != null) params.append("limit", limitRef.current);

      appendListParam(params, "tenantname", filters.tenantname);

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/myclients?${params}`;

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

      const totalsKey = JSON.stringify({ total: totalCount, filters });
      if (totalsKey !== lastTotalsKeyRef.current) {
        lastTotalsKeyRef.current = totalsKey;
        await fetchTotals(filters, totalCount);
      }
    } catch (err) {
      setError(err.message);
      setTotals({ totalTickets: 0, openTickets: 0, completionRate: 0, newTickets: 0, completedTickets: 0 });
    } finally {
      setLoading(false);
    }
  }, [fetchTotals, getAccessToken]);

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