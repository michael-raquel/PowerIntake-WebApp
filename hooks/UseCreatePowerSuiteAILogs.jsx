import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

const resolveFeedbackValue = (feedback, feedbackType) => {
	if (typeof feedback === "boolean") return feedback;
	if (feedbackType === "up") return true;
	if (feedbackType === "down") return false;
	return null;
};

const normalizeWhitespace = (value) => value.replace(/\s+/g, " ").trim();

const stripHtml = (value) => {
	if (!value) return value;
	if (typeof window !== "undefined" && window.DOMParser) {
		const doc = new window.DOMParser().parseFromString(value, "text/html");
		return normalizeWhitespace(doc.body?.textContent ?? "");
	}
	return normalizeWhitespace(value.replace(/<[^>]*>/g, " "));
};

export function useCreatePowerSuiteAILog() {
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

	const createPowerSuiteAILog = useCallback(
		async ({ entrauserid, title, description, suggestion, feedback, feedbackType, createdby }) => {
			try {
				setSubmitting(true);
				setError(null);

				const resolvedFeedback = resolveFeedbackValue(feedback, feedbackType);
				const sanitizedSuggestion = stripHtml(suggestion ?? "");
				const accessToken = await getAccessToken();

				const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/powersuiteailogs`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
					},
					body: JSON.stringify({
						entrauserid: entrauserid ?? null,
						title: title ?? null,
						description: description ?? null,
						suggestion: sanitizedSuggestion ? sanitizedSuggestion : null,
						feedback: resolvedFeedback ?? null,
						createdby: createdby ?? null,
					}),
				});

				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
				}

				return data;
			} catch (err) {
				setError(err.message || "Failed to create PowerSuite AI log");
				throw err;
			} finally {
				setSubmitting(false);
			}
		},
		[getAccessToken]
	);

	const submitFeedback = useCallback(
		async ({ feedbackType, ...payload }) => {
			return createPowerSuiteAILog({ ...payload, feedbackType });
		},
		[createPowerSuiteAILog]
	);

	return { createPowerSuiteAILog, submitFeedback, submitting, error };
}

export default useCreatePowerSuiteAILog;

