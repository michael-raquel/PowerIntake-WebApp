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

export default function useFetchAllCompanyUsers(_initialPage = 1, initialLimit = null, options = {}) {
  const { tokenInfo }    = useAuth();
  const { instance, accounts } = useMsal();
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const filterOptions = {
    roles: ["Super Admin", "Admin", "Manager", "User"],
    departments: [],
    managers: [],
    statuses: ["true", "false"],
  };
  const limitRef                    = useRef(initialLimit);
  const fetchAll                     = Boolean(options?.fetchAll);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

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
      appendListParam(params, "manager",    filters.manager);
      if (filters.role)       params.append("role",       filters.role);
      if (filters.selectedRoles && filters.selectedRoles.length > 0) {
        params.append("role", filters.selectedRoles.join(","));
      }
      appendListParam(params, "department", filters.department);
      appendListParam(params, "status",     filters.status);

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
      let rows = json.data || [];

      if (fetchAll && totalCount > rows.length) {
        const allParams = new URLSearchParams({ page: 1, limit: totalCount, entratenantid });

        if (filters.search)     allParams.append("search",     filters.search);
        appendListParam(allParams, "manager",    filters.manager);
        if (filters.role)       allParams.append("role",       filters.role);
        if (filters.selectedRoles && filters.selectedRoles.length > 0) {
          allParams.append("role", filters.selectedRoles.join(","));
        }
        appendListParam(allParams, "department", filters.department);
        appendListParam(allParams, "status",     filters.status);

        const allUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/mycompany?${allParams}`;

        const allRes = await fetch(allUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        if (allRes.ok) {
          const allJson = await allRes.json();
          rows = allJson.data || rows;
        }
      }

      setData(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchAll, tokenInfo?.account?.tenantId, getAccessToken]);

  useEffect(() => {
    if (initialLimit !== limitRef.current) {
      limitRef.current = initialLimit;
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
    fetchData,
    filterOptions,
  };
}