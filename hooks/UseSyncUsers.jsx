import { useState, useCallback } from "react";

const useSyncUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const syncUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/sync`,
        { method: "POST" }
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${body}`);
      }

      const json = await res.json();
      setResult(json);
    } catch (err) {
      console.error("[useSyncUsers] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { syncUsers, loading, error, result };
};

export default useSyncUsers;