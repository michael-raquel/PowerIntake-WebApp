import { useState } from "react";
import ManageTabs from "@/components/manage/ManageTabs";
import MyClientsTab from "@/components/manage/MyClientsTab";
import MyCompanyTab from "@/components/manage/MyCompanyTab";
import MyTeamTab from "@/components/manage/MyTeamTab";
import SuperAdminTab from "@/components/manage/SuperAdminTab";

const TABS = [
  { id: "admin",   label: "Super Admin"},
  { id: "clients", label: "My Clients" },
  { id: "company", label: "My Company" },
  { id: "team",    label: "My Team"    },
];

export default function Manage() {
  const [activeTab, setActiveTab] = useState("admin");

  return (
    <div className="p-6">
        <div className="mb-4">
            <h2 className="font-bold text-sm sm:text-lg">Manage</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your team and company</p>
        </div>
      <ManageTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mt-4">
        {activeTab === "admin"   && <SuperAdminTab />}
        {activeTab === "clients" && <MyClientsTab />}
        {activeTab === "company" && <MyCompanyTab />}
        {activeTab === "team"    && <MyTeamTab />}
      </div>
    </div>
  );
}