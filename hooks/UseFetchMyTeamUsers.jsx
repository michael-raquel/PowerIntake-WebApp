import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export default function useFetchMyTeam(initialPage = 1, initialLimit = 12) {
  const { tokenInfo } = useAuth();
  const { instance, accounts } = useMsal();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const entrauserid = tokenInfo?.account?.localAccountId;

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
      if (!entrauserid) return;

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          entrauserid,
          page: currentPage,
          limit,
        });

        if (filters.search) params.append("search", filters.search);
        if (filters.status) params.append("status", filters.status);

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/myteam?${params}`;

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
    [entrauserid, getAccessToken, limit],
  );

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
