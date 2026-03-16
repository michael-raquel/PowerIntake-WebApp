import { useState } from "react";
import ManageTabs from "@/components/manage/ManageTabs";
import MyClientsTab from "@/components/manage/MyClientsTab";
import MyCompanyTab from "@/components/manage/MyCompanyTab";
import MyTeamTab from "@/components/manage/MyTeamTab";
import SuperAdminTab from "@/components/manage/SuperAdminTab";
import useManagerCheck from "@/hooks/UseManagerCheck";

export default function Manage() {
  const { isManager, loading } = useManagerCheck();
  const [activeTab, setActiveTab] = useState("company");

  const tabs = [
    { id: "admin",   label: "Super Admin" },
    { id: "clients", label: "My Clients"  },
    { id: "company", label: "My Company"  },
    ...(isManager ? [{ id: "team", label: "My Team" }] : []),
  ];

  const validTab = tabs.find((t) => t.id === activeTab)
    ? activeTab
    : tabs[0]?.id ?? "company";

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-32" />
      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-56" />
      <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-full" />
    </div>
  );

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