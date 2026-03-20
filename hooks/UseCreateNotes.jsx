import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useCreateNote() {
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

	const createNote = useCallback(
		async ({ ticketuuid, note, createdby }) => {
			if (!ticketuuid || !note?.trim()) {
				throw new Error("ticketuuid and note are required");
			}

			try {
				setSubmitting(true);
				setError(null);

				const accessToken = await getAccessToken();

				const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/notes`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
					},
					body: JSON.stringify({
						ticketuuid,
						note: note.trim(),
						createdby: createdby ?? null,
					}),
				});

				if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

				return await res.json();
			} catch (err) {
				setError(err.message || "Failed to create note");
				throw err;
			} finally {
				setSubmitting(false);
			}
		},
		[getAccessToken]
	);

	return { createNote, submitting, error };
}
