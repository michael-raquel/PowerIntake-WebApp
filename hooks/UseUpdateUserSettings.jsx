import { useState, useCallback } from "react";

export function useUpdateUserSettings() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const updateUserSettings = useCallback(async (settings) => {
    if (!settings || !settings.usersettingsuuid) return null;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data && data.error) || "Failed to update user settings",
        );
      }

      return data;
    } catch (err) {
      setError(err.message || "Failed to update user settings");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { updateUserSettings, submitting, error };
}
