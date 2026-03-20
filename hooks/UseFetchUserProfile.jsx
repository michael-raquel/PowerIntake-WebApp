import { useState, useEffect } from "react";

export function useFetchUserProfile(localAccountId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!localAccountId) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users?id=${localAccountId}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const data = await res.json();

        const user = Array.isArray(data?.users)
          ? data.users.find(u => u.id === localAccountId) ?? null
          : null;

        setProfile(user);
      } catch (err) {
        setError(err.message || "Failed to fetch user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [localAccountId]);

  return { profile, loading, error };
}