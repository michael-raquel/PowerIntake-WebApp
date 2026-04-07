"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ComUpdateForm from "@/components/tenant/ComUpdateForm";

export default function AdminView() {
  const { userInfo, accessToken, tokenInfo } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTenant = useCallback(async () => {
    if (!accessToken) {
      setTenant(null);
      setLoading(false);
      return;
    }

    const tenantUuid = String(
      userInfo?.tenantuuid || userInfo?.v_tenantuuid || "",
    ).trim();
    const entraTenantId = String(
      userInfo?.entratenantid ||
        userInfo?.v_entratenantid ||
        tokenInfo?.account?.tenantId ||
        "",
    ).trim();

    if (!tenantUuid && !entraTenantId) {
      setTenant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = tenantUuid
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/tenants/${tenantUuid}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/tenants?${new URLSearchParams({ entratenantid: entraTenantId }).toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch tenant");
      const data = await res.json();

      const tenantRecord = Array.isArray(data)
        ? data[0] || null
        : Array.isArray(data?.data)
          ? data.data[0] || null
          : data;

      setTenant(tenantRecord || null);
    } catch (err) {
      console.error("[AdminView] Failed to load tenant:", err);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    tokenInfo?.account?.tenantId,
    userInfo?.entratenantid,
    userInfo?.tenantuuid,
    userInfo?.v_entratenantid,
    userInfo?.v_tenantuuid,
  ]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  const header = (
    <div className="px-4 bg-linear-to-l from-pink-500 to-violet-800 rounded-xl py-5 shrink-0 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-black text-xl sm:text-2xl text-white tracking-tight">
            My Tenant
          </h2>
          <p className="text-xs text-white/60 mt-0.5">
            View and update your tenant details
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-dvh flex flex-col p-4 pb-0 gap-4">
        {header}
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="h-dvh flex flex-col p-4 pb-0 gap-4">
        {header}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No tenant record found for your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col p-4 pb-0 gap-4 overflow-auto">
      {header}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <ComUpdateForm
          tenant={tenant}
          inline
          mode="admin"
          onUpdated={fetchTenant}
        />
      </div>
    </div>
  );
}
