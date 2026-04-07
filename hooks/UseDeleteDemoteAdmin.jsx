import { useState, useMemo, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";
import { useAuth } from "@/context/AuthContext";
import { useFetchAppRole } from "@/hooks/UseFetchAppRole";
import { useFetchTenant } from "@/hooks/UseFetchTenant";

const DEFAULT_CLIENT_ID = "6ccf8b01-7af5-497b-9e23-45a92d68a226";

export default function useDeleteDemoteAdmin({
    clientId = DEFAULT_CLIENT_ID,
    roleValue = "Admin",
    roleDisplayName = "Admin",
    unassignEndpoint = "/groups/unassign",
    method = "DELETE",
    useTenantGroups,
} = {}) {
    const { instance, accounts } = useMsal();
    const { account } = useAuth();
    const userOid = account?.idTokenClaims?.oid ?? null;

    const normalizeRoleKey = useCallback((value) =>
        String(value || "").replace(/\s+/g, "").toLowerCase(),
    []);

    const shouldUseTenantGroups = useMemo(() => {
        if (typeof useTenantGroups === "boolean") return useTenantGroups;
        return normalizeRoleKey(roleValue) === "admin" || normalizeRoleKey(roleDisplayName) === "admin";
    }, [normalizeRoleKey, roleValue, roleDisplayName, useTenantGroups]);

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
        entratenantid: shouldUseTenantGroups ? entraTenantId : null,
        enabled: shouldUseTenantGroups && Boolean(entraTenantId),
    });

    const {
        data: appRoleData,
        loading: appRoleLoading,
        error: appRoleError,
        refetch: refetchAppRoles,
    } = useFetchAppRole({
        clientId: shouldUseTenantGroups ? null : clientId,
        endpoint: "/groups/app-roles-with-groups",
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

    const appRoleGroupId = useMemo(() => {
        const roles = appRoleData?.appRoles ?? [];
        const match = roles.find(
            (role) => role.value === roleValue || role.displayName === roleDisplayName
        );
        return match?.groups?.[0]?.groupId ?? null;
    }, [appRoleData, roleValue, roleDisplayName]);

    const groupId = shouldUseTenantGroups ? adminGroupId : appRoleGroupId;
    const groupIdLoading = shouldUseTenantGroups ? tenantLoading : appRoleLoading;
    const groupIdError = shouldUseTenantGroups ? tenantError : appRoleError;

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

    const demoteAdmin = useCallback(async (targetUserOid = null) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const resolvedUserOid = targetUserOid || userOid;
            if (!resolvedUserOid) throw new Error("User OID not available");
            if (!groupId) throw new Error("Admin groupId not found");

            const accessToken = await getAccessToken();
            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${unassignEndpoint}`;
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({ userOid: resolvedUserOid, groupId }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                // Ignore 404s. A 404 implies the user is already absent from the group, 
                // which satisfies the demotion request (often due to Entra ID sync delays).
                if (res.status === 404) {
                    console.warn("[demoteAdmin] Received 404 (Not Found). User may already be removed or replication is delayed. Treating as success.");
                } else {
                    throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
                }
            }

            setSuccess(true);
            return data;
        } catch (err) {
            setError(err.message || "Failed to demote user");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getAccessToken, groupId, method, unassignEndpoint, userOid]);

    return {
        demoteAdmin,
        loading,
        error,
        success,
        userOid,
        groupId,
        adminGroupId,
        userGroupId,
        appRoleData,
        appRoleLoading: groupIdLoading,
        appRoleError: groupIdError,
        refetchAppRoles,
        tenantId: entraTenantId,
    };
}
