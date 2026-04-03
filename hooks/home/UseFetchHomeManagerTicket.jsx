import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

const DEFAULT_TOTALS = {
	v_inprogress: 0,
	v_new: 0,
	v_completed: 0,
	v_completionrate: 0,
	total_count: 0,
};

export function useFetchHomeManagerTicket({
	managerentrauserid = null,
	status = null,
	refreshKey = 0,
	enabled = true,
} = {}) {
	const { instance, accounts } = useMsal();
	const [data, setData] = useState([]);
	const [totals, setTotals] = useState(DEFAULT_TOTALS);
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

	const fetchData = useCallback(async () => {
		if (!managerentrauserid) {
			setData([]);
			setTotals(DEFAULT_TOTALS);
			return;
		}

		if (!enabled) return;

		setLoading(true);
		setError(null);
		try {
			const accessToken = await getAccessToken();

			const params = new URLSearchParams({ managerentrauserid });
			if (status) params.append("status", status);

			const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/manager/home?${params}`;

			const res = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
				},
			});

			if (!res.ok) {
				const body = await res.text();
				throw new Error(`${res.status} ${res.statusText} - ${body}`);
			}

			const json = await res.json();
			setData(json?.rows || []);
			setTotals(json?.totals || DEFAULT_TOTALS);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [managerentrauserid, status, enabled, getAccessToken]);

	useEffect(() => {
		fetchData();
	}, [fetchData, refreshKey]);

	return {
		data,
		totals,
		loading,
		error,
		refetch: fetchData,
	};
}
