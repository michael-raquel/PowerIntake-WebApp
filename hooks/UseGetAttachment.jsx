import { useState, useCallback } from 'react';

export default function useGetAttachments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attachments, setAttachments] = useState([]);

  const getAttachments = useCallback(async ({ ticketuuid, attachmentuuid } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (ticketuuid) params.append('ticketuuid', ticketuuid);
      if (attachmentuuid) params.append('attachmentuuid', attachmentuuid);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/attachments?${params.toString()}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch attachments');
      }

      setAttachments(data);
      return data;
    } catch (err) {
      console.error('Get attachments error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getAttachments, attachments, loading, error };
}