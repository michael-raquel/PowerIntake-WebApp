import { useState, useCallback } from "react";
import { format } from "date-fns";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useUpdateTicket({ account, onSuccess } = {}) {
  const { instance, accounts } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  const updateTicket = useCallback(
    async ({
      ticketuuid,
      formData,
      supportCalls = null,
    }) => {
      setLoading(true);
      setError(null);

      const hasSupportCalls = Array.isArray(supportCalls) && supportCalls.length > 0;

      const body = {
        ticketuuid,
        title:          formData.title,
        description:    formData.description,
        usertimezone:   formData.timezone ?? null,
        officelocation: formData.location ? formData.location.toLowerCase() : null,
        date:           hasSupportCalls
          ? supportCalls.map(c => format(c.date, "yyyy-MM-dd"))
          : null,
        starttime: hasSupportCalls
          ? supportCalls.map(c => c.fromTime)
          : null,
        endtime: hasSupportCalls
          ? supportCalls.map(c => c.toTime)
          : null,
        modifiedby: account?.name,
      };

      try {
        const accessToken = await getAccessToken();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify(body),
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update ticket");

        const updatedTicketuuid = data.ticket_update || data.ticketuuid || ticketuuid;
        onSuccess?.(updatedTicketuuid);
        return data;
      } catch (err) {
        setError(err.message || "Failed to update ticket");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [account, onSuccess, getAccessToken]
  );

  return { updateTicket, loading, error };
}