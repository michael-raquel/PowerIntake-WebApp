import { useState, useCallback } from 'react';

export default function useUploadImage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadImage = useCallback(async (file, customName = null) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      if (customName) {
        formData.append('name', customName);
      } else {
        const fileName = file.name.split('.').slice(0, -1).join('.') || file.name;
        formData.append('name', fileName);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/images/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error || data.success === false) {
        throw new Error(data.error || 'Upload failed');
      }

      return {
        name: data.blobName || file.name,
        blobName: data.blobName || file.name,
        url: data.url,
        size: data.size,
        mimetype: data.mimetype,
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { uploadImage, loading, error };
}