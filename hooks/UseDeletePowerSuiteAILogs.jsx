import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useDeletePowerSuiteAILogs() {
  const { instance, accounts } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  const deletePowerSuiteAILog = useCallback(
    async (powersuiteailogsuuid) => {
      setLoading(true);
      setError(null);

      try {
        if (!powersuiteailogsuuid) {
          throw new Error("powersuiteailogsuuid is required");
        }

        const accessToken = await getAccessToken();
        const encoded = encodeURIComponent(powersuiteailogsuuid);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/powersuiteailogs/${encoded}`,
          {
            method: "DELETE",
            headers: {
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Delete failed");
        }

        return data;
      } catch (err) {
        setError(err.message || "Failed to delete PowerSuite AI log");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAccessToken]
  );

  return { deletePowerSuiteAILog, loading, error };
}

export default useDeletePowerSuiteAILogs;
