import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

const resolveRoleValue = (payload) => {
  if (!payload) return "";

  const pickRole = (value) => {
    if (!value) return "";

    const roleValue =
      value.userrole ??
      value.user_role ??
      value.userRole ??
      value.role ??
      value.roles ??
      value.v_role ??
      value.v_userrole ??
      value.v_user_role ??
      "";

    if (Array.isArray(roleValue)) {
      return roleValue.filter(Boolean).join(", ");
    }

    return roleValue ? String(roleValue) : "";
  };

  if (Array.isArray(payload)) {
    return pickRole(payload[0]);
  }

  return pickRole(payload);
};

export function useFetchUserRole({ entrauserid = "", enabled = true } = {}) {
  const { instance, accounts } = useMsal();
  const [userRoleData, setUserRoleData] = useState(null);
  const [userRole, setUserRole] = useState("");
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

  const fetchUserRole = useCallback(async (targetEntrauserid = entrauserid) => {
    if (!targetEntrauserid) {
      setUserRoleData(null);
      setUserRole("");
      return { data: null, roleValue: "" };
    }

    if (!accounts?.[0]) {
      const err = new Error("No account available");
      setError(err.message);
      throw err;
    }

    setLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const params = new URLSearchParams({ entrauserid: targetEntrauserid });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/role?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText} - ${body}`);
      }

      const data = await res.json();
      const roleValue = resolveRoleValue(data);

      setUserRoleData(data);
      setUserRole(roleValue);

      return { data, roleValue };
    } catch (err) {
      setError(err.message || "Failed to fetch user role");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [accounts, entrauserid, getAccessToken]);

  useEffect(() => {
    if (enabled && entrauserid) {
      fetchUserRole(entrauserid);
    }
  }, [enabled, entrauserid, fetchUserRole]);

  return {
    userRole,
    userRoleData,
    loading,
    error,
    refetch: fetchUserRole,
    fetchUserRole,
  };
}

export default useFetchUserRole;
