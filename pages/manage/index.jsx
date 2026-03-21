import { useState } from "react";
import ManageTabs from "@/components/manage/ManageTabs";
import MyClientsTab from "@/components/manage/MyClientsTab";
import MyCompanyTab from "@/components/manage/MyCompanyTab";
import MyTeamTab from "@/components/manage/MyTeamTab";
import SuperAdminTab from "@/components/manage/SuperAdminTab";
import useManagerCheck from "@/hooks/UseManagerCheck";
import { useAuth } from "@/context/AuthContext";
import { ExternalLink, Users } from "lucide-react";

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
    <div className="min-h-screen flex flex-col p-4 md:p-6 pb-0 md:pb-0">
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

      <div className="mt-4 flex-1">
        {validTab === "admin"   && <SuperAdminTab />}
        {validTab === "clients" && <MyClientsTab />}
        {validTab === "company" && <MyCompanyTab />}
        {validTab === "team"    && <MyTeamTab />}
      </div>
      <footer className="mt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="px-6 py-3 flex flex-col sm:flex-row items-center sm:justify-between gap-4 relative">
          <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
            Sparta Services, LLC
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap hidden sm:block absolute left-1/2 -translate-x-1/2">
            &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
          </p>
          <div className="flex flex-nowrap justify-center sm:justify-end sm:flex-wrap gap-x-3 sm:gap-x-6 gap-y-1 sm:gap-y-2 w-full sm:w-auto">
            <a href="https://www.spartaserv.com/terms-conditions" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
              style={{ fontSize: "clamp(11px, 3vw, 14px)" }}>
              Terms
              <ExternalLink style={{ width: "clamp(10px, 2.5vw, 12px)", height: "clamp(10px, 2.5vw, 12px)" }} className="opacity-60 flex-shrink-0" />
            </a>
            <a href="https://www.spartaserv.com/privacy-policy" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
              style={{ fontSize: "clamp(11px, 3vw, 14px)" }}>
              Privacy Policy
              <ExternalLink style={{ width: "clamp(10px, 2.5vw, 12px)", height: "clamp(10px, 2.5vw, 12px)" }} className="opacity-60 flex-shrink-0" />
            </a>
            <a href="https://www.spartaserv.com" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
              style={{ fontSize: "clamp(11px, 3vw, 14px)" }}>
              spartaserv.com
              <ExternalLink style={{ width: "clamp(10px, 2.5vw, 12px)", height: "clamp(10px, 2.5vw, 12px)" }} className="opacity-60 flex-shrink-0" />
            </a>
            <a href="https://Portal.SpartaServ.com" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
              style={{ fontSize: "clamp(11px, 3vw, 14px)" }}>
              Portal
              <ExternalLink style={{ width: "clamp(10px, 2.5vw, 12px)", height: "clamp(10px, 2.5vw, 12px)" }} className="opacity-60 flex-shrink-0" />
            </a>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 sm:hidden text-center">
            &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}