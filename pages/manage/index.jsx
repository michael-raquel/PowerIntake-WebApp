import { useState } from "react";
import ManageTabs from "@/components/manage/ManageTabs";
import MyClientsTab from "@/components/manage/MyClientsTab";
import MyCompanyTab from "@/components/manage/MyCompanyTab";
import MyTeamTab from "@/components/manage/MyTeamTab";
import SuperAdminTab from "@/components/manage/SuperAdminTab";
import useManagerCheck from "@/hooks/UseManagerCheck";
import { useAuth } from "@/context/AuthContext";
import { Users } from "lucide-react";

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
      <div className="mb-4 px-4 bg-gradient-to-l from-pink-500 to-violet-800 rounded-xl py-5 flex-shrink-0 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-xl sm:text-2xl text-white tracking-tight">Manage</h2>
              <p className="text-xs text-white/60 mt-0.5">Manage your team and company</p>
            </div>
          </div>
        </div>
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