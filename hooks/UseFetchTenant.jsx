import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useFetchTenant({
  tenantid = null,
  entratenantid = null,
  dynamicsaccountid = null,
  isconsented = null,
  isactive = null,
  refreshKey = 0,
  enabled = true,
} = {}) {
  const { instance, accounts } = useMsal();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  useEffect(() => {
    if (!enabled) return;

    const fetchTenants = async () => {
      try {
        setLoading(true);
        setError(null);

        const accessToken = await getAccessToken();

        const params = new URLSearchParams();

        if (tenantid !== null) params.append("tenantid", tenantid);
        if (entratenantid) params.append("entratenantid", entratenantid);
        if (dynamicsaccountid)
          params.append("dynamicsaccountid", dynamicsaccountid);

        // ✅ BOOLEAN SAFE
        if (isconsented !== null)
          params.append("isconsented", String(isconsented));

        if (isactive !== null)
          params.append("isactive", String(isactive));

        const query = params.toString();

        const url = query
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/tenants?${query}`
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}/tenants`;

        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok)
          throw new Error(data.error || `Error ${res.status}`);

        setTenants(data || []);
      } catch (err) {
        setError(err.message || "Failed to fetch tenants");
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [
    tenantid,
    entratenantid,
    dynamicsaccountid,
    isconsented,
    isactive,
    refreshKey,
    enabled,
    getAccessToken,
  ]);

  return { tenants, setTenants, loading, error };
}