import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useCreateUserSettings() {
  const { instance, accounts } = useMsal();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;

    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return token?.accessToken ?? null;
  }, [accounts, instance]);

  const createUserSettings = useCallback(
    async ({
      entrauserid,
      outlook,
      teams,
      powersuiteai,
      spartaassist,
      darkmode,
      createdby,
    }) => {
      if (!entrauserid) {
        throw new Error("entrauserid is required");
      }

      try {
        setSubmitting(true);
        setError(null);

        const accessToken = await getAccessToken();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/usersettings`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
            body: JSON.stringify({
              entrauserid,
              outlook: outlook ?? false,
              teams: teams ?? false,
              powersuiteai: powersuiteai ?? false,
              spartaassist: spartaassist ?? false,
              darkmode: darkmode ?? false,
              createdby: createdby ?? null,
            }),
          },
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Error ${res.status}: ${res.statusText}`,
          );
        }

        return await res.json();
      } catch (err) {
        setError(err.message || "Failed to create user settings");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [getAccessToken],
  );

  return { createUserSettings, submitting, error };
}
