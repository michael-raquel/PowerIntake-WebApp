import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useUpdateUserSettings() {
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

	const updateUserSettings = useCallback(
		async ({
			usersettingsuuid,
			outlook,
			teams,
			powersuiteai,
			spartaassist,
			darkmode,
			modifiedby,
		}) => {
			if (!usersettingsuuid) {
				throw new Error("usersettingsuuid is required");
			}

			try {
				setSubmitting(true);
				setError(null);

				const accessToken = await getAccessToken();

				const res = await fetch(
					`${process.env.NEXT_PUBLIC_API_BASE_URL}/usersettings`,
					{
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
						},
						body: JSON.stringify({
							usersettingsuuid,
							outlook: outlook ?? false,
							teams: teams ?? false,
							powersuiteai: powersuiteai ?? false,
							spartaassist: spartaassist ?? false,
							darkmode: darkmode ?? false,
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
				setError(err.message || "Failed to update user settings");
				throw err;
			} finally {
				setSubmitting(false);
			}
		},
		[getAccessToken]
	);

	return { updateUserSettings, submitting, error };
}