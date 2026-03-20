import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useFetchUserSettings({ useruuid = '', entrauserid = '' } = {}) {
  const { instance, accounts } = useMsal();
  const [userSettings, setUserSettings] = useState([]);
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

  const fetchUserSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = await getAccessToken();

      const params = new URLSearchParams();
      if (useruuid)    params.append("useruuid",    useruuid);
      if (entrauserid) params.append("entrauserid", entrauserid);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/usersettings?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          cache: "no-store",
        }
      );

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const data = await res.json();
      setUserSettings(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch user settings");
    } finally {
      setLoading(false);
    }
  }, [useruuid, entrauserid, getAccessToken]);

  useEffect(() => {
    fetchUserSettings();
  }, [fetchUserSettings]);

  return { userSettings, loading, error, refetch: fetchUserSettings };
}