import { useState, useCallback } from "react";
import { format } from "date-fns";

export function useCreateTicket({ account, onSuccess } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createTicket = useCallback(
    async ({ formData, supportCalls = null, attachments = null }) => {
      setLoading(true);
      setError(null);

      const hasSupportCalls =
        Array.isArray(supportCalls) && supportCalls.length > 0;
      const hasAttachments =
        Array.isArray(attachments) && attachments.length > 0;

      const body = {
        title: formData.title,
        description: formData.description,

        usertimezone: formData.timezone ?? null,
        officelocation: formData.location
          ? formData.location.toLowerCase()
          : null,
        date: hasSupportCalls
          ? supportCalls.map((c) => format(c.date, "yyyy-MM-dd"))
          : null,
        starttime: hasSupportCalls ? supportCalls.map((c) => c.fromTime) : null,
        endtime: hasSupportCalls ? supportCalls.map((c) => c.toTime) : null,
        attachments: hasAttachments
          ? attachments.map((f) => f.blobName || f.name)
          : null,

        createdby: account?.name || null,
        entrauserid: account?.localAccountId || null,
      };

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error((data && data.error) || "Failed to create ticket");
        }

        const createdTicketuuid =
          data?.ticket_create || data?.ticketuuid || null;
        onSuccess?.(createdTicketuuid);
        return data;
      } catch (err) {
        setError(err.message || "Failed to create ticket");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [account, onSuccess],
  );

  return { createTicket, loading, error };
}
