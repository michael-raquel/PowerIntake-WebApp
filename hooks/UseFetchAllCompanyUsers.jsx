import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export default function useFetchAllCompanyUsers(
  initialPage = 1,
  initialLimit = 12,
) {
  const { instance, accounts } = useMsal();
  const { tokenInfo } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  const fetchData = useCallback(
    async (currentPage = 1, filters = {}) => {
      const entratenantid = tokenInfo?.account?.tenantId;

      if (!entratenantid) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit,
          entratenantid,
        });

        if (filters.search) params.append("search", filters.search);
        if (filters.manager) params.append("manager", filters.manager);
        if (filters.role) params.append("role", filters.role);
        if (filters.department) params.append("department", filters.department);
        if (filters.status) params.append("status", filters.status);

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/mycompany?${params}`;

        const accessToken = await getAccessToken();

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
        setData(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
        setPage(currentPage);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [getAccessToken, limit, tokenInfo?.account?.tenantId],
  );

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
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    fetchData,
  };
}
