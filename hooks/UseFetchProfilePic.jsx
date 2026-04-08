import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useAuth } from "@/context/AuthContext";
import { useFetchTicket } from "@/hooks/UseFetchTicket";

export function useFetchProfilePic({ ticketuuid = "", enabled = true } = {}) {
	const { instance, accounts } = useMsal();
	const { profilePhotoUrl, tokenInfo } = useAuth();
	const account = accounts?.[0] ?? null;

	const shouldFetchTicket = enabled && Boolean(ticketuuid);
	const {
		tickets = [],
		loading: ticketLoading,
		error: ticketError,
	} = useFetchTicket({ ticketuuid, enabled: shouldFetchTicket });

	const targetEntraUserId = useMemo(() => {
		const ticket = tickets?.[0] ?? null;
		return ticket?.v_entrauserid || ticket?.entrauserid || "";
	}, [tickets]);

	const currentEntraUserId =
		tokenInfo?.account?.localAccountId || account?.localAccountId || "";
	const isCurrentUser =
		Boolean(targetEntraUserId) && targetEntraUserId === currentEntraUserId;

	const [photoUrl, setPhotoUrl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		let isActive = true;
		let objectUrl = null;

		const clearPhoto = () => {
			setPhotoUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return null;
			});
		};

		if (!enabled || !account || !targetEntraUserId || isCurrentUser) {
			clearPhoto();
			setLoading(false);
			setError(null);
			return () => {};
		}

		const fetchPhoto = async () => {
			setLoading(true);
			setError(null);

			try {
				const graphRes = await instance.acquireTokenSilent({
					scopes: ["User.ReadBasic.All"],
					account,
				});

				const photoRes = await fetch(
					`https://graph.microsoft.com/v1.0/users/${targetEntraUserId}/photo/$value`,
					{ headers: { Authorization: `Bearer ${graphRes.accessToken}` } },
				);

				if (photoRes.status === 404) {
					if (isActive) clearPhoto();
					return;
				}

				if (!photoRes.ok) throw new Error("Graph photo request failed");

				const blob = await photoRes.blob();
				objectUrl = URL.createObjectURL(blob);

				if (!isActive) {
					URL.revokeObjectURL(objectUrl);
					return;
				}

				setPhotoUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return objectUrl;
				});
			} catch (err) {
				if (!isActive) return;
				clearPhoto();
				setError(err?.message ?? "Failed to fetch photo");
			} finally {
				if (isActive) setLoading(false);
			}
		};

		fetchPhoto();

		return () => {
			isActive = false;
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [account, enabled, instance, targetEntraUserId, isCurrentUser]);

	const resolvedPhotoUrl = isCurrentUser ? profilePhotoUrl : photoUrl;

	return {
		photoUrl: resolvedPhotoUrl,
		entrauserid: targetEntraUserId,
		loading: ticketLoading || loading,
		error: error ?? ticketError ?? null,
	};
}
