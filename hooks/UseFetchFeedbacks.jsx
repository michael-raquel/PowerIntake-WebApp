import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useFetchFeedback(ticketuuid = null, feedbackuuid = null) {
	const { instance, accounts } = useMsal();
	const [feedbacks, setFeedbacks] = useState([]);
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

	const fetchFeedbacks = useCallback(async () => {
		if (!accounts?.[0]) {
			setFeedbacks([]);
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const accessToken = await getAccessToken();

			const params = new URLSearchParams();
			if (ticketuuid) params.append("ticketuuid", ticketuuid);
			if (feedbackuuid) params.append("feedbackuuid", feedbackuuid);

			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_BASE_URL}/feedbacks?${params.toString()}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
					},
				},
			);

			if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

			const data = await res.json();
			setFeedbacks(Array.isArray(data) ? data : []);
		} catch (err) {
			setError(err.message || "Failed to fetch feedback");
			setFeedbacks([]);
		} finally {
			setLoading(false);
		}
	}, [accounts, getAccessToken, ticketuuid, feedbackuuid]);

	useEffect(() => {
		fetchFeedbacks();
	}, [fetchFeedbacks]);

	return { feedbacks, loading, error, fetchFeedbacks, setFeedbacks };
}
