import { useState, useMemo, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";
import { useAuth } from "@/context/AuthContext";
import { useFetchTenant } from "@/hooks/UseFetchTenant";

export default function useCreatePromoteAdmin({
	assignEndpoint = "/groups/assign",
} = {}) {
	const { instance, accounts } = useMsal();
	const { account } = useAuth();
	const userOid = account?.idTokenClaims?.oid ?? null;

	const entraTenantId = useMemo(() => {
		const idTokenTid = account?.idTokenClaims?.tid ?? accounts?.[0]?.idTokenClaims?.tid;
		if (idTokenTid) return String(idTokenTid);
		return account?.tenantId ?? accounts?.[0]?.tenantId ?? null;
	}, [account, accounts]);

	const {
		tenants,
		loading: tenantLoading,
		error: tenantError,
	} = useFetchTenant({
		entratenantid: entraTenantId,
		enabled: Boolean(entraTenantId),
	});

	const tenantRecord = useMemo(() => {
		if (!tenants) return null;
		return Array.isArray(tenants) ? tenants[0] : tenants;
	}, [tenants]);

	const adminGroupId = useMemo(() => (
		tenantRecord?.admingroupid ?? tenantRecord?.v_admingroupid ?? null
	), [tenantRecord]);

	const userGroupId = useMemo(() => (
		tenantRecord?.usergroupid ?? tenantRecord?.v_usergroupid ?? null
	), [tenantRecord]);

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
			if (!adminGroupId) throw new Error("Admin groupId not found for tenant");

			const accessToken = await getAccessToken();
			const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${assignEndpoint}`;
			const res = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
				},
				body: JSON.stringify({ userOid: resolvedUserOid, groupId: adminGroupId }),
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
	}, [assignEndpoint, getAccessToken, adminGroupId, userOid]);

	return {
		promoteAdmin,
		loading,
		error,
		success,
		userOid,
		groupId: adminGroupId,
		userGroupId,
		tenantId: entraTenantId,
		fetchingGroupId: tenantLoading,
		tenantError,
	};
}
