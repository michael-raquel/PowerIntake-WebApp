import { useState, useEffect, useCallback } from "react";

export function useFetchUserSettings({ useruuid = '', entrauserid = '' } = {}) {
  const [userSettings, setUserSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (useruuid) params.append("useruuid", useruuid);
      if (entrauserid) params.append("entrauserid", entrauserid);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/usersettings?${params.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
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
  }, [useruuid, entrauserid]);

  useEffect(() => {
    fetchUserSettings();
  }, [fetchUserSettings]);

  return { userSettings, loading, error, refetch: fetchUserSettings };
}