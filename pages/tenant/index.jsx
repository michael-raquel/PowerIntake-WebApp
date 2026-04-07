"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import SuperAdminView from "./SuperAdminView";
import AdminView from "./AdminView";

export default function TenantPage() {
  const { tokenInfo } = useAuth();

  const currentRole = useMemo(() => {
    const roles = tokenInfo?.account?.roles ?? [];
    if (roles.includes("SuperAdmin")) return "super-admin";
    if (roles.includes("Admin")) return "admin";
    return null;
  }, [tokenInfo]);

  if (currentRole === "admin") return <AdminView />;
  if (currentRole === "super-admin") return <SuperAdminView />;

  return null;
}