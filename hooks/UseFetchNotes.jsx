// Frontend: hooks/UseFetchNotes.js
import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useFetchNote() {
  const { instance, accounts } = useMsal();
  const [notes, setNotes] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accounts[0]) return;

    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Acquire token scoped to YOUR API
        const response = await instance.acquireTokenSilent({
          ...apiRequest,
          account: accounts[0],
        });

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/notes`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${response.accessToken}`,
            },
          },
        );

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const data = await res.json();
        setNotes(data || []);
        setCount(data.count || 0);
      } catch (err) {
        setError(err.message || "Failed to fetch notes");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [accounts, instance]);

  return { notes, count, loading, error };
}