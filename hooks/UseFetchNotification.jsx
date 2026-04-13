import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useFetchNotification({ useruuid = "", enabled = true } = {}) {
  const { instance, accounts } = useMsal();
  const [notifications, setNotifications] = useState([]);
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

  const fetchNotifications = useCallback(async () => {
    if (!enabled || !useruuid) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accessToken = await getAccessToken();
      const params = new URLSearchParams({ useruuid });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          cache: "no-store",
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Error ${res.status}: ${res.statusText}`,
        );
      }

      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, [enabled, getAccessToken, useruuid]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    setNotifications,
    loading,
    error,
    refetch: fetchNotifications,
  };
}
