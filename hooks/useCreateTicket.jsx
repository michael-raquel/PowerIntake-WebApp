import { useState, useCallback } from "react";
import { format } from "date-fns";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useCreateTicket({ account, onSuccess } = {}) {
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

  const createTicket = useCallback(async ({ formData, supportCalls, attachments = [] }) => {
    setLoading(true);
    setError(null);

    const body = {
      entrauserid:    account?.localAccountId,
      entratenantid:  account?.tenantId,
      title:          formData.title,
      description:    formData.description,
      date:           supportCalls.map(c => format(c.date, "yyyy-MM-dd")),
      starttime:      supportCalls.map(c => c.fromTime),
      endtime:        supportCalls.map(c => c.toTime),
      usertimezone:   formData.timezone,
      officelocation: formData.location.toLowerCase(),
      attachments:    attachments.map(f => f.url),
      createdby:      account?.localAccountId,
    };

    try {
      const accessToken = await getAccessToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit ticket");

      onSuccess?.(data.ticketuuid);
      console.log("Ticket created with UUID:", data);
      return data.ticketuuid;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [account, onSuccess, getAccessToken]);

  return { createTicket, loading, error };
}