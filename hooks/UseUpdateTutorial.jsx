import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useUpdateTutorial() {
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

	const updateTutorial = useCallback(
		async ({ entrauserid, tutorial_name }) => {
			if (!entrauserid) throw new Error("entrauserid is required");
			if (!tutorial_name) throw new Error("tutorial_name is required");

			try {
				setLoading(true);
				setError(null);

				const accessToken = await getAccessToken();

				const res = await fetch(
					`${process.env.NEXT_PUBLIC_API_BASE_URL}/usersettings/tutorial`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
						},
						body: JSON.stringify({ entrauserid, tutorial_name }),
					}
				);

				if (!res.ok) {
					const errorData = await res.json().catch(() => ({}));
					throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
				}

				return await res.json();
			} catch (err) {
				setError(err.message || "Failed to update tutorial");
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[getAccessToken]
	);

	return { updateTutorial, loading, error };
}