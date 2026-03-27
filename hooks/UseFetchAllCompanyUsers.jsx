import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export default function useFetchAllCompanyUsers(initialPage = 1, initialLimit = null) {
  const { tokenInfo }    = useAuth();
  const { instance, accounts } = useMsal();
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(initialPage);
  const [limit, setLimit]           = useState(initialLimit);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totals,     setTotals]     = useState({ totalTickets: 0, openTickets: 0 });
  const [allRoleData, setAllRoleData] = useState([]);
  const filterOptions = {
    roles: ["Super Admin", "Admin", "Manager", "User"],
    departments: [],
    managers: [],
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
    const entratenantid = tokenInfo?.account?.tenantId;

    if (!entratenantid || !totalCount) {
      setTotals({ totalTickets: 0, openTickets: 0 });
      return;
    }

    const accessToken = await getAccessToken();

    const params = new URLSearchParams({ page: 1, limit: totalCount, entratenantid });

    if (filters.search)     params.append("search",     filters.search);
    if (filters.manager)    params.append("manager",    filters.manager);
    if (filters.role)       params.append("role",       filters.role);
    if (filters.selectedRoles && filters.selectedRoles.length > 0) {
      params.append("role", filters.selectedRoles.join(","));
    }
    if (filters.department) params.append("department", filters.department);
    if (filters.status)     params.append("status",     filters.status);

    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/mycompany?${params}`;

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
  }, [getAccessToken, tokenInfo?.account?.tenantId]);

  const fetchAllRoleData = useCallback(async (filters, totalCount) => {
    const entratenantid = tokenInfo?.account?.tenantId;
    const hasRole = filters?.role || (filters?.selectedRoles && filters.selectedRoles.length > 0);

    if (!entratenantid || !hasRole || !totalCount) {
      setAllRoleData([]);
      return;
    }

    try {
      const accessToken = await getAccessToken();

      const params = new URLSearchParams({ page: 1, limit: totalCount, entratenantid });

      if (filters.search)     params.append("search",     filters.search);
      if (filters.manager)    params.append("manager",    filters.manager);
      if (filters.role)       params.append("role",       filters.role);
      if (filters.selectedRoles && filters.selectedRoles.length > 0) {
        params.append("role", filters.selectedRoles.join(","));
      }
      if (filters.department) params.append("department", filters.department);
      if (filters.status)     params.append("status",     filters.status);

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/mycompany?${params}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!res.ok) {
        setAllRoleData([]);
        return;
      }

      const json = await res.json();
      setAllRoleData(json.data || []);
    } catch (err) {
      setAllRoleData([]);
    }
  }, [getAccessToken, tokenInfo?.account?.tenantId]);

  const fetchData = useCallback(async (currentPage = 1, filters = {}) => {
    const entratenantid = tokenInfo?.account?.tenantId;

    if (!entratenantid) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const accessToken = await getAccessToken();

      const params = new URLSearchParams({ page: currentPage, entratenantid });

      if (limitRef.current != null) params.append("limit", limitRef.current);

      if (filters.search)     params.append("search",     filters.search);
      if (filters.manager)    params.append("manager",    filters.manager);
      if (filters.role)       params.append("role",       filters.role);
      if (filters.selectedRoles && filters.selectedRoles.length > 0) {
        params.append("role", filters.selectedRoles.join(","));
      }
      if (filters.department) params.append("department", filters.department);
      if (filters.status)     params.append("status",     filters.status);

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/mycompany?${params}`;

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

      await fetchAllRoleData(filters, totalCount);

      const totalsKey = JSON.stringify({ total: totalCount, filters, entratenantid });
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
  }, [fetchAllRoleData, fetchTotals, tokenInfo?.account?.tenantId, getAccessToken]);

  useEffect(() => {
    if (initialLimit !== limitRef.current) {
      limitRef.current = initialLimit;
      setLimit(initialLimit);
      if (tokenInfo?.account?.tenantId) {
        fetchData(1);
      }
    }
  }, [initialLimit, fetchData, tokenInfo?.account?.tenantId]);

  useEffect(() => {
    if (tokenInfo?.account?.tenantId) {
      fetchData(1);
    }
  }, [fetchData, tokenInfo?.account?.tenantId]);

  return {
    data,
    loading,
    error,
    page,
    limit,
    total,
    totals,
    allRoleData,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    fetchData,
    filterOptions,
  };
}