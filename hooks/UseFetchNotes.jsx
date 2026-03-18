import { useState, useEffect, useCallback } from "react";

export function useFetchNote(ticketuuid) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    if (!ticketuuid) {
      setNotes([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("ticketuuid", ticketuuid);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/notes?${params.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const data = await res.json();
      // Assume API returns an array of notes; normalize otherwise
      setNotes(Array.isArray(data) ? data : data?.notes || []);
    } catch (err) {
      setError(err.message || "Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  }, [ticketuuid]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, error, fetchNotes };
}
