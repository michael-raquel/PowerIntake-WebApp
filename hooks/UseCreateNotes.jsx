import { useState, useCallback } from "react";

export function useCreateNote() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const createNote = useCallback(async ({ ticketuuid, note, createdby }) => {
    if (!ticketuuid || !note) return null;

    try {
      setSubmitting(true);
      setError(null);

      const body = {
        ticketuuid,
        note,
        createdby,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && data.error) || "Failed to create note");
      }

      return data;
    } catch (err) {
      setError(err.message || "Failed to create note");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { createNote, submitting, error };
}
