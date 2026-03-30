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

export default function useFetchSuperAdminUsers(_initialPage = 1, initialLimit = null, options = {}) {
  const { instance, accounts } = useMsal();
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const filterOptions = {
    roles: ["Super Admin", "Admin", "Manager", "User"],
    statuses: ["true", "false"],
    clientnames: [],
  };
  const limitRef                    = useRef(initialLimit);
  const fetchAll                     = Boolean(options?.fetchAll);

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
    if (!accounts?.[0]) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: currentPage });

      if (limitRef.current != null) params.append("limit", limitRef.current);

      if (filters.search)     params.append("search",     filters.search);
      appendListParam(params, "clientname", filters.clientname);
      if (filters.role)       params.append("role",       filters.role);
      if (filters.selectedRoles && filters.selectedRoles.length > 0) {
        params.append("role", filters.selectedRoles.join(","));
      }
      appendListParam(params, "status",     filters.status);

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
      let rows = json.data || [];

      if (fetchAll && totalCount > rows.length) {
        const allParams = new URLSearchParams({ page: 1, limit: totalCount });

        if (filters.search)     allParams.append("search",     filters.search);
        appendListParam(allParams, "clientname", filters.clientname);
        if (filters.role)       allParams.append("role",       filters.role);
        if (filters.selectedRoles && filters.selectedRoles.length > 0) {
          allParams.append("role", filters.selectedRoles.join(","));
        }
        appendListParam(allParams, "status",     filters.status);

        const accessToken = await getAccessToken();
        const allUrl = resolveApiUrl(`/manageusers/superadmin?${allParams}`);

        const allRes = await fetch(allUrl, {
          headers: {
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
      if (err instanceof TypeError) {
        setError("Network error. Check API base URL, CORS, and server availability.");
      } else {
        setError(err?.message || String(err));
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [accounts, fetchAll, getAccessToken, resolveApiUrl]);

  useEffect(() => {
    if (!accounts?.[0]) return;
    if (initialLimit !== limitRef.current) {
      limitRef.current = initialLimit;
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
    fetchData,
    filterOptions,
  };
}