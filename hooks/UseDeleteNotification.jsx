import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useDeleteNotification() {
  const { instance, accounts } = useMsal();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  const deleteNotification = useCallback(
    async ({ useruuid, deletedby, notificationuuid = null }) => {
      if (!useruuid || !deletedby) {
        throw new Error("useruuid and deletedby are required");
      }

      try {
        setSubmitting(true);
        setError(null);

        const accessToken = await getAccessToken();

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            useruuid,
            deletedby,
            notificationuuid,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
        }

        return await res.json().catch(() => ({ success: true }));
      } catch (err) {
        setError(err.message || "Failed to delete notification");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [getAccessToken],
  );

  return { deleteNotification, submitting, error };
}
