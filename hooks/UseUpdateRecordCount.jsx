import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useUpdateRecordCount() {
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

	const updateRecordCount = useCallback(
		async ({
			entrauserid,
			ticketrecordcount,
			managerecordcount,
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
					`${process.env.NEXT_PUBLIC_API_BASE_URL}/usersettings/record-counts`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
						},
						body: JSON.stringify({
							entrauserid,
							ticketrecordcount: ticketrecordcount ?? null,
							managerecordcount: managerecordcount ?? null,
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
				setError(err.message || "Failed to update record count");
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[getAccessToken]
	);

	return { updateRecordCount, loading, error };
}
