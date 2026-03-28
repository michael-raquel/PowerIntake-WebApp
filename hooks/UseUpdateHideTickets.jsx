import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useUpdateHideTickets() {
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

    const updateHideTickets = useCallback(
        async ({
            entrauserid,
            hideCompleted,
            modifiedby,
        }) => {
            if (!entrauserid) {
                throw new Error("entrauserid is required");
            }

            try {
                setLoading(true);
                setError(null);

                const accessToken = await getAccessToken();

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/usersettings/hide-completed-tickets`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        },
                        body: JSON.stringify({
                            entrauserid,
                            hidecompletedtickets: hideCompleted ?? null,
                            modifiedby: modifiedby ?? null,
                        }),
                    }
                );

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(
                        errorData.error || `Error ${res.status}: ${res.statusText}`
                    );
                }

                return await res.json();
            } catch (err) {
                setError(err.message || "Failed to update hide completed tickets");
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [getAccessToken]
    );

    return { updateHideTickets, loading, error };
}
