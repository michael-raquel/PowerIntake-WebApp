import { useState, useCallback } from 'react';

export default function useDownloadImage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const downloadImage = useCallback(async (blobName, filename) => {
    setLoading(true);
    setError(null);

    try {
      if (!blobName) {
        throw new Error('Blob name is required');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/images/download/${encodeURIComponent(blobName)}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Download failed');
      }

      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || blobName;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);

      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { downloadImage, loading, error };
}