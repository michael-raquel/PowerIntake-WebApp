import { useState, useEffect } from "react";

export function useFetchUserSettings({ entrauserid } = {}) {
  const [userSettings, setUserSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!entrauserid) {
      setUserSettings([]);
      return;
    }

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append("entrauserid", entrauserid);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/settings?${params.toString()}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const data = await res.json();
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.settings)
            ? data.settings
            : data
              ? [data]
              : [];
        setUserSettings(normalized);
      } catch (err) {
        setError(err.message || "Failed to fetch user settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [entrauserid]);

  return { userSettings, loading, error };
}
