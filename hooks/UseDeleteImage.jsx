import { useState, useCallback } from 'react';

export default function useDeleteImage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteImage = useCallback(async (blobName) => {
    setLoading(true);
    setError(null);

    try {
      if (!blobName) {
        throw new Error('Blob name is required');
      }

      const encodedBlobName = encodeURIComponent(blobName);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/images/upload/${encodedBlobName}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Delete failed');
      }

      return { success: true, message: data.message };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteImage, loading, error };
}