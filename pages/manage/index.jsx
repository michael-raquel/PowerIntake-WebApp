import { useState, useRef, useCallback, useEffect } from "react";
import ManageTabs from "@/components/manage/ManageTabs";
import MyClientsTab from "@/components/manage/MyClientsTab";
import MyCompanyTab from "@/components/manage/MyCompanyTab";
import MyTeamTab from "@/components/manage/MyTeamTab";
import SuperAdminTab from "@/components/manage/SuperAdminTab";
import useManagerCheck from "@/hooks/UseManagerCheck";
import { useAuth } from "@/context/AuthContext";
import { ExternalLink, Users } from "lucide-react";

const ROW_HEIGHT = 50;
const MIN_RECORDS = 1;
const DEFAULT_ROWS = 10;

export default function Manage() {
  const { isManager, loading } = useManagerCheck();
  const { tokenInfo } = useAuth();
  const [activeTab, setActiveTab] = useState("admin");
  const [searchValue, setSearchValue] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({});
  const tableContainerRef = useRef(null);
  const [recordsPerPage, setRecordsPerPage] = useState(DEFAULT_ROWS);

  const updateRecordsPerPage = useCallback(() => {
    if (!tableContainerRef.current) return;
    const height = tableContainerRef.current.clientHeight;
    if (!height) return;

    const calculated = Math.max(MIN_RECORDS, Math.floor(height / ROW_HEIGHT));
    setRecordsPerPage((prev) => (prev !== calculated ? calculated : prev));
  }, []);

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

  useEffect(() => {
    const raf = requestAnimationFrame(updateRecordsPerPage);
    window.addEventListener("resize", updateRecordsPerPage);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateRecordsPerPage);
    };
  }, [updateRecordsPerPage, validTab]);

  return (
    <div className="min-h-[100dvh] flex flex-col p-4 pb-0">
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div className="px-4 bg-gradient-to-l from-pink-500 to-violet-800 rounded-xl py-5 flex-shrink-0 shadow-md">
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
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSearchValue("");
            setSelectedFilters({});
          }}
        />

        <div className="flex-1 min-h-0 flex flex-col">
          {validTab === "admin"   && <SuperAdminTab recordsPerPage={recordsPerPage} tableContainerRef={tableContainerRef} selectedFilters={selectedFilters} searchValue={searchValue} onFiltersChange={setSelectedFilters} onSearchChange={setSearchValue} />}
          {validTab === "clients" && <MyClientsTab recordsPerPage={recordsPerPage} tableContainerRef={tableContainerRef} selectedFilters={selectedFilters} searchValue={searchValue} onFiltersChange={setSelectedFilters} onSearchChange={setSearchValue} />}
          {validTab === "company" && <MyCompanyTab recordsPerPage={recordsPerPage} tableContainerRef={tableContainerRef} selectedFilters={selectedFilters} searchValue={searchValue} onFiltersChange={setSelectedFilters} onSearchChange={setSearchValue} />}
          {validTab === "team"    && <MyTeamTab recordsPerPage={recordsPerPage} tableContainerRef={tableContainerRef} selectedFilters={selectedFilters} searchValue={searchValue} onFiltersChange={setSelectedFilters} onSearchChange={setSearchValue} />}
        </div>
      </div>

      <footer className="mt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="px-6 py-2 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0 order-1 sm:order-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">Sparta Services, LLC</p>
          </div>
          <div className="flex items-center gap-1 shrink-0 order-2 sm:order-3">
            {[
              { href: 'https://www.spartaserv.com/terms-conditions', label: 'Terms' },
              { href: 'https://www.spartaserv.com/privacy-policy', label: 'Privacy Policy' },
              { href: 'https://www.spartaserv.com', label: 'SpartaServ.com' },
              { href: 'https://Portal.SpartaServ.com', label: 'Portal' },
            ].map((link, i, arr) => (
              <span key={link.label} className="flex items-center">
                <a href={link.href} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-purple-600 dark:text-purple-400 underline underline-offset-2 decoration-purple-300 dark:decoration-purple-700 hover:decoration-purple-600 dark:hover:decoration-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all whitespace-nowrap">
                  {link.label}
                  <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                </a>
                {i < arr.length - 1 && (
                  <span className="w-px h-3 bg-gray-300 dark:bg-gray-700 mx-0.5 shrink-0" />
                )}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap order-3 sm:order-2">
            &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}