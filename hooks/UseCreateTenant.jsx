import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

export function useCreateTenant({ account, onSuccess } = {}) {
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

  const createTenant = useCallback(
    async ({
      entratenantid,
      tenantname,
      tenantemail,
      createdby,
      dynamicsaccountid,
      superadmingroupid,
      admingroupid,
      companyallgroupid,
    } = {}) => {
      setLoading(true);
      setError(null);

      const body = {
        entratenantid: entratenantid?.trim() || null,
        tenantname: tenantname?.trim() || null,
        tenantemail: tenantemail?.trim() || null,
        createdby: createdby ?? account?.localAccountId ?? null,
        dynamicsaccountid: dynamicsaccountid?.trim() || null,
        superadmingroupid: superadmingroupid?.trim() || null,
        admingroupid: admingroupid?.trim() || null,
        companyallgroupid: companyallgroupid?.trim() || null,
      };

      try {
        const accessToken = await getAccessToken();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/tenants`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
            body: JSON.stringify(body),
          },
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to create tenant");

        onSuccess?.(data.tenantuuid);
        return data.tenantuuid;
      } catch (err) {
        setError(err.message || "Failed to create tenant");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [account, onSuccess, getAccessToken],
  );

  return { createTenant, loading, error };
}

export default useCreateTenant;
