import { useState } from "react";
import ManageTabs from "@/components/manage/ManageTabs";
import MyClientsTab from "@/components/manage/MyClientsTab";
import MyCompanyTab from "@/components/manage/MyCompanyTab";
import MyTeamTab from "@/components/manage/MyTeamTab";
import SuperAdminTab from "@/components/manage/SuperAdminTab";
import useManagerCheck from "@/hooks/UseManagerCheck";
import { useAuth } from "@/context/AuthContext";

export default function Manage() {
  const { isManager, loading } = useManagerCheck();
  const { tokenInfo } = useAuth();
  const [activeTab, setActiveTab] = useState("admin");

  const roles      = tokenInfo?.account?.roles ?? [];
  const isSuperAdmin = roles.includes("SuperAdmin");

  const tabs = [
    ...(isSuperAdmin ? [{ id: "admin",   label: "Super Admin" }] : []),
    ...(isSuperAdmin ? [{ id: "clients", label: "My Clients"  }] : []),
    { id: "company", label: "My Company" },
    ...(isManager ? [{ id: "team", label: "My Team" }] : []),
  ];

  const validTab = tabs.find((t) => t.id === activeTab)
    ? activeTab
    : tabs[0]?.id ?? "company";

  return (
    <div className="p-6 rounded-lg">
      <div className="mb-4 px-2 bg-gradient-to-l from-pink-500 to-violet-800 rounded-lg py-4">
        <h2 className="font-bold text-sm sm:text-lg text-white">Manage</h2>
        <p className="text-xs sm:text-sm text-gray-200 mt-1">
          Manage your team and company
        </p>
      </div>

      <ManageTabs
        tabs={tabs}
        activeTab={validTab}
        onTabChange={setActiveTab}
      />

      <div className="mt-4">
        {validTab === "admin"   && <SuperAdminTab />}
        {validTab === "clients" && <MyClientsTab />}
        {validTab === "company" && <MyCompanyTab />}
        {validTab === "team"    && <MyTeamTab />}
      </div>
    </div>
  );
}