import { useState, useMemo, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";
import { useFetchAppRole } from "@/hooks/UseFetchAppRole";

const DEFAULT_CLIENT_ID = "6ccf8b01-7af5-497b-9e23-45a92d68a226";

export default function useCreatePromoteSuperAdmin({
  clientId = DEFAULT_CLIENT_ID,
  roleValue = "SuperAdmin",
  assignEndpoint = "/groups/assign",
} = {}) {
  const { instance, accounts } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const {
    data: appRoleData,
    loading: appRoleLoading,
    error: appRoleError,
    refetch: refetchAppRoles,
  } = useFetchAppRole({ clientId, endpoint: "/groups/app-roles-with-groups" });

  const groupId = useMemo(() => {
    const roles = appRoleData?.appRoles ?? [];
    const match = roles.find(
      (role) => role.value === roleValue || role.displayName === "Super Admin"
    );
    return match?.groups?.[0]?.groupId ?? null;
  }, [appRoleData, roleValue]);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  const promoteSuperAdmin = useCallback(async (userOid) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!userOid) throw new Error("User OID is required");
      if (!groupId) throw new Error("SuperAdmin groupId not available");

      const accessToken = await getAccessToken();
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${assignEndpoint}`;
      
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ userOid, groupId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
      }

      setSuccess(true);
      return data;
    } catch (err) {
      setError(err.message || "Failed to promote user");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [assignEndpoint, getAccessToken, groupId]);

  return {
    promoteSuperAdmin,
    loading,
    error,
    success,
    groupId,
    fetchingGroupId: appRoleLoading,
    appRoleError,
    refetchAppRoles,
  };
}
