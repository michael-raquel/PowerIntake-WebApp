import { useState } from "react";

export default function useAutoSyncDynamics() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);

  const runSync = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/auto-sync-dynamics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${text}`);
      }

      const json = await res.json();
      setData(json);

      return json; 
    } catch (err) {
      console.error("[useAutoSyncDynamics] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { runSync, loading, error, data };
}