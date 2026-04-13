import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useUpdateNotificationIsRead() {
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

  const updateNotificationIsRead = useCallback(
    async ({ useruuid, isread, modifiedby, notificationuuid = null }) => {
      if (!useruuid || isread === undefined || isread === null || !modifiedby) {
        throw new Error("useruuid, isread, and modifiedby are required");
      }

      const normalizedIsRead = String(isread).toLowerCase();
      if (normalizedIsRead !== "true" && normalizedIsRead !== "false") {
        throw new Error("isread must be true or false");
      }

      try {
        setSubmitting(true);
        setError(null);

        const accessToken = await getAccessToken();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/isread`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              useruuid,
              isread: normalizedIsRead,
              modifiedby,
              notificationuuid,
            }),
          },
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Error ${res.status}: ${res.statusText}`,
          );
        }

        return await res.json().catch(() => ({ success: true }));
      } catch (err) {
        setError(err.message || "Failed to update notification");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [getAccessToken],
  );

  return { updateNotificationIsRead, submitting, error };
}
