import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useFetchUserProfile(localAccountId) {
  const { instance, accounts } = useMsal();
  const [profile, setProfile] = useState(null);
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
    if (!localAccountId) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const accessToken = await getAccessToken();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users?id=${localAccountId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
          },
        );

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const data = await res.json();

        const user = Array.isArray(data?.users)
          ? (data.users.find((u) => u.id === localAccountId) ?? null)
          : null;

        setProfile(user);
      } catch (err) {
        setError(err.message || "Failed to fetch user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [getAccessToken, localAccountId]);

  return { profile, loading, error };
}
