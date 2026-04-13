import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useUpdatePowerSuiteAILogs({ account, onSuccess } = {}) {
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

	const updatePowerSuiteAILogsTicketId = useCallback(
		async ({ powersuiteailogsuuid, ticketuuid }) => {
			if (!powersuiteailogsuuid && !ticketuuid) {
				throw new Error("powersuiteailogsuuid and ticketuuid are required");
			}

			setLoading(true);
			setError(null);

			try {
				const accessToken = await getAccessToken();

				const res = await fetch(
					`${process.env.NEXT_PUBLIC_API_BASE_URL}/powersuiteailogs`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
						},
						body: JSON.stringify({
							powersuiteailogsuuid: powersuiteailogsuuid ?? null,
							ticketuuid: ticketuuid ?? null,
						}),
					}
				);

				const data = await res.json();
				if (!res.ok) throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);

				onSuccess?.(data.powersuiteailogsuuid ?? powersuiteailogsuuid);
				return data;
			} catch (err) {
				setError(err.message || "Failed to update PowerSuite AI log");
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[getAccessToken, onSuccess]
	);

	return { updatePowerSuiteAILogsTicketId, loading, error };
}

export default useUpdatePowerSuiteAILogs;

