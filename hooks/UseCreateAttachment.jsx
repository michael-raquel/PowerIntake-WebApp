import { useState, useCallback } from 'react';
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export default function useCreateAttachments() {
  const { instance, accounts } = useMsal();
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

  const createAttachments = useCallback(async ({ ticketuuid, attachments, createdby }) => {
    setLoading(true);
    setError(null);

    try {
      if (!ticketuuid) throw new Error('Ticket UUID is required');
      if (!attachments || !attachments.length) throw new Error('Attachments are required');
      if (!createdby) throw new Error('Created by is required');

      const accessToken = await getAccessToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          ticketuuid,
          attachments,
          createdby,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create attachments');
      }

      return data;
    } catch (err) {
      console.error('Create attachments error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  return { createAttachments, loading, error };
}