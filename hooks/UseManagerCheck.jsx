import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function useManagerCheck() {
  const { tokenInfo } = useAuth();
  const [isManager, setIsManager] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
//aura
  useEffect(() => {
    const entrauserid = tokenInfo?.account?.localAccountId;
    if (!entrauserid) return;

    const check = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/manageusers/managercheck?entrauserid=${entrauserid}`
        );

        if (!res.ok) {
          const body = await res.text();
          throw new Error(`${res.status} ${res.statusText} — ${body}`);
        }

        const json = await res.json();

        const result = json.user_manager_check ?? json.v_ismanager ?? json ?? false;
        setIsManager(Boolean(result));
      } catch (err) {
        console.error("[useManagerCheck] Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [tokenInfo?.account?.localAccountId]);

  return { isManager, loading, error };
}