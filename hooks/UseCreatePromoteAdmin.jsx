import { useState, useMemo, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";
import { useAuth } from "@/context/AuthContext";
import { useFetchAppRole } from "@/hooks/UseFetchAppRole";

const DEFAULT_CLIENT_ID = "6ccf8b01-7af5-497b-9e23-45a92d68a226";

export default function useCreatePromoteAdmin({
	clientId = DEFAULT_CLIENT_ID,
	roleValue = "Admin",
	roleDisplayName = "Admin",
	assignEndpoint = "/groups/assign",
} = {}) {
	const { instance, accounts } = useMsal();
	const { account } = useAuth();
	const userOid = account?.idTokenClaims?.oid ?? null;

	const {
		data: appRoleData,
		loading: appRoleLoading,
		error: appRoleError,
		refetch: refetchAppRoles,
	} = useFetchAppRole({ clientId, endpoint: "/groups/app-roles-with-groups" });

	const groupId = useMemo(() => {
		const roles = appRoleData?.appRoles ?? [];
		const match = roles.find(
			(role) => role.value === roleValue || role.displayName === roleDisplayName
		);
		return match?.groups?.[0]?.groupId ?? null;
	}, [appRoleData, roleValue, roleDisplayName]);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);

	const getAccessToken = useCallback(async () => {
		if (!accounts?.[0]) return null;

		const token = await instance.acquireTokenSilent({
			...apiRequest,
			account: accounts[0],
		});

		return token?.accessToken ?? null;
	}, [accounts, instance]);

	const promoteAdmin = useCallback(async (targetUserOid = null) => {
		setLoading(true);
		setError(null);
		setSuccess(false);

		try {
			const resolvedUserOid = targetUserOid || userOid;
			if (!resolvedUserOid) throw new Error("User OID not available");
			if (!groupId) throw new Error("Admin groupId not found");

			const accessToken = await getAccessToken();
			const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${assignEndpoint}`;
			const res = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
				},
				body: JSON.stringify({ userOid: resolvedUserOid, groupId }),
			});

			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
			}

			setSuccess(true);
			return data;
		} catch (err) {
			setError(err.message || "Failed to promote user");
			throw err;
		} finally {
			setLoading(false);
		}
	}, [assignEndpoint, getAccessToken, groupId, userOid]);

	return {
		promoteAdmin,
		loading,
		error,
		success,
		userOid,
		groupId,
		appRoleData,
		appRoleLoading,
		appRoleError,
		refetchAppRoles,
	};
}
