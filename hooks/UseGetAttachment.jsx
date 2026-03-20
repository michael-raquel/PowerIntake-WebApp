import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export default function useGetAttachments() {
  const { instance, accounts } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attachments, setAttachments] = useState([]);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  const getAttachments = useCallback(
    async ({ ticketuuid, attachmentuuid } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (ticketuuid) params.append("ticketuuid", ticketuuid);
        if (attachmentuuid) params.append("attachmentuuid", attachmentuuid);

        const accessToken = await getAccessToken();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/attachments?${params.toString()}`,
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

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch attachments");
        }

        setAttachments(data);
        return data;
      } catch (err) {
        console.error("Get attachments error:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAccessToken],
  );

  return { getAttachments, attachments, loading, error };
}
