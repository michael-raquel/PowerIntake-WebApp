import { useState } from "react";
import ManageTabs from "@/components/manage/ManageTabs";
import SuperAdminTab from "@/components/manage/SuperAdminTab";
import MyClientsTab from "@/components/manage/MyClientsTab";
import MyCompanyTab from "@/components/manage/MyCompanyTab";
import MyTeamTab from "@/components/manage/MyTeamTab";

const tabs = [
  { id: "super-admin", label: "Super Admin" },
  { id: "my-clients",  label: "My Clients" },
  { id: "my-company",  label: "My Company" },
  { id: "my-team",     label: "My Team" },
];

export default function SuperAdminManagePage() {
  const [activeTab, setActiveTab] = useState("super-admin");

  const renderContent = () => {
    switch (activeTab) {
      case "super-admin": return <SuperAdminTab />;
      case "my-clients":  return <MyClientsTab />;
      case "my-company":  return <MyCompanyTab />;
      case "my-team":     return <MyTeamTab />;
      default:            return null;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-black min-h-screen transition-colors duration-300">
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Manage</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your team, company, and clients</p>
        </div>
        <ManageTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mt-4">{renderContent()}</div>
      </div>
    </div>
  );
}