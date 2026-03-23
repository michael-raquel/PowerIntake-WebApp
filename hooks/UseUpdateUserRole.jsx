import { useCallback, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export default function useUpdateUserRole({ endpoint = "/users/role" } = {}) {
  const { instance, accounts } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  const updateUserRole = useCallback(async ({ entrauserid, userrole, modifiedby }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!entrauserid) throw new Error("EntraUserID is required");

      const accessToken = await getAccessToken();
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ entrauserid, userrole, modifiedby }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
      }

      setSuccess(true);
      return data;
    } catch (err) {
      setError(err.message || "Failed to update user role");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, getAccessToken]);

  return {
    updateUserRole,
    loading,
    error,
    success,
  };
}
