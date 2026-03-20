import { useState, useCallback } from 'react';

export default function useUpdateAttachments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateAttachments = useCallback(async ({ ticketuuid, attachments, modifiedby }) => {
    setLoading(true);
    setError(null);

    try {
      if (!ticketuuid) throw new Error('Ticket UUID is required');
      if (!modifiedby) throw new Error('Modified by is required');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attachments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketuuid,
          attachments: attachments || [],
          modifiedby,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update attachments');
      }

      return data; 
    } catch (err) {
      console.error('Update attachments error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateAttachments, loading, error };
}