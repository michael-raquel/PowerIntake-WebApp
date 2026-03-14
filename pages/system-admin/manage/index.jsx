import { useState } from "react";
import ManageTabs from "@/pages/components/managetabs";
import MyClientsTab from "@/pages/components/manage/MyClientsTab";
import MyCompanyTab from "@/pages/components/manage/MyCompanyTab";
import MyTeamTab from "@/pages/components/manage/MyTeamTab";

const tabs = [
  { id: "my-clients", label: "My Clients" },
  { id: "my-company", label: "My Company" },
  { id: "my-team",    label: "My Team" },
];

export default function SystemAdminManagePage() {
  const [activeTab, setActiveTab] = useState("my-clients");

  const renderContent = () => {
    switch (activeTab) {
      case "my-clients": return <MyClientsTab />;
      case "my-company": return <MyCompanyTab />;
      case "my-team":    return <MyTeamTab />;
      default:           return null;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-black min-h-screen transition-colors duration-300">
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Manage</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your clients, team, and company</p>
        </div>
        <ManageTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mt-4">{renderContent()}</div>
      </div>
    </div>
  );
}