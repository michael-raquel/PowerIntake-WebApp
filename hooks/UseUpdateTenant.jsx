import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
};

const normalizeBoolean = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;

  const lowered = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(lowered)) return true;
  if (["false", "0", "no", "n"].includes(lowered)) return false;

  return null;
};

export function useUpdateTenant({ onSuccess } = {}) {
  const { instance, accounts } = useMsal();
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

  const updateTenant = useCallback(
    async ({
      tenantuuid,
      entratenantid,
      tenantname,
      tenantemail,
      dynamicsaccountid,
      admingroupid,
      usergroupid,
      isactive,
      isconsented,
      isapproved, // ✅ added
    } = {}) => {
      const normalizedTenantUuid = normalizeText(tenantuuid);
      if (!normalizedTenantUuid) {
        const missingUuidError = "Tenant UUID is required";
        setError(missingUuidError);
        throw new Error(missingUuidError);
      }

      setLoading(true);
      setError(null);

      const body = {
        tenantuuid: normalizedTenantUuid,
        entratenantid: normalizeText(entratenantid),
        tenantname: normalizeText(tenantname),
        tenantemail: normalizeText(tenantemail),
        dynamicsaccountid: normalizeText(dynamicsaccountid),
        admingroupid: normalizeText(admingroupid),
        usergroupid: normalizeText(usergroupid),
        isactive: normalizeBoolean(isactive),
        isconsented: normalizeBoolean(isconsented),
        isapproved: normalizeBoolean(isapproved), // ✅ added
      };

      try {
        const accessToken = await getAccessToken();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/tenants`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
            body: JSON.stringify(body),
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to update tenant");

        const updatedTenantUuid = data.tenantuuid || body.tenantuuid;
        onSuccess?.(updatedTenantUuid);
        return data;
      } catch (err) {
        setError(err.message || "Failed to update tenant");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAccessToken, onSuccess]
  );

  return { updateTenant, loading, error };
}

export default useUpdateTenant;