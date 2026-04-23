import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

const normalizeToArray = (value) => {
	if (Array.isArray(value)) return value;
	if (value === undefined || value === null || value === "") return [];
	return [value];
};

export function useCreateFeedback() {
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

	const createFeedback = useCallback(
		async ({
			ticketuuid,
			feedback,
			feedbacktype,
			contactconsent,
			email,
			classification,
			createdby,
			images,
		} = {}) => {
			const normalizedFeedbackType = feedbacktype?.trim();
			const requiresTicket = normalizedFeedbackType === "ticket";

			if (
				(requiresTicket && !ticketuuid) ||
				!feedback?.trim() ||
				!normalizedFeedbackType ||
				contactconsent === undefined ||
				contactconsent === null ||
				!email?.trim() ||
				!classification?.trim() ||
				!createdby
			) {
				throw new Error(
					"ticketuuid (for ticket feedback), feedback, feedbacktype, contactconsent, email, classification, and createdby are required",
				);
			}

			try {
				setSubmitting(true);
				setError(null);

				const accessToken = await getAccessToken();
				const imageArray = normalizeToArray(images);

				const res = await fetch(
					`${process.env.NEXT_PUBLIC_API_BASE_URL}/feedbacks`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
						},
						body: JSON.stringify({
							ticketuuid,
							feedback: feedback.trim(),
							feedbacktype: normalizedFeedbackType,
							contactconsent,
							email: email.trim(),
							classification: classification.trim(),
							createdby,
							images: imageArray.length > 0 ? imageArray : null,
						}),
					},
				);

				const data = await res.json().catch(() => ({}));

				if (!res.ok) {
					throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
				}

				return data;
			} catch (err) {
				setError(err.message || "Failed to create feedback");
				throw err;
			} finally {
				setSubmitting(false);
			}
		},
		[getAccessToken],
	);

	return { createFeedback, submitting, error };
}

export default useCreateFeedback;
