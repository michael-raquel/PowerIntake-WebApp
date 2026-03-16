import { useState, useEffect } from "react";

export function useFetchUserProfile(entrauserid) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!entrauserid) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append("entrauserid", entrauserid);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/profile?${params.toString()}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const data = await res.json();
        // Normalize: API may return single object or array
        const normalized = Array.isArray(data)
          ? data[0]
          : data?.profile || data;
        setProfile(normalized || null);
      } catch (err) {
        setError(err.message || "Failed to fetch user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [entrauserid]);

  return { profile, loading, error };
}
