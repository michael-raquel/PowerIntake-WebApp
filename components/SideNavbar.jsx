import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Home,
  Ticket,
  LifeBuoy,
  Users,
  Building2,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { useMsal } from "@azure/msal-react";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import Notification from "@/components/Notification";

const MOBILE_BREAKPOINT = 768;

export default function SideNavbar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const { instance } = useMsal();
  const { tokenInfo, profilePhotoUrl } = useAuth();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const hide = () => setShowLogout(false);
    router.events.on("routeChangeStart", hide);
    return () => router.events.off("routeChangeStart", hide);
  }, [router.events]);

  const account = tokenInfo?.account;

  const currentRole = useMemo(() => {
    const roles = account?.roles ?? [];
    if (roles.includes("SuperAdmin")) return "super-admin";
    if (roles.includes("SystemAdmin")) return "system-admin";
    if (roles.includes("Admin")) return "admin";
    if (roles.includes("Manager")) return "manager";
    return "user";
  }, [account]);

  const roleLabel = useMemo(() => {
    return currentRole
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [currentRole]);

  const isPrivileged = ["manager", "system-admin", "super-admin", "admin"].includes(
    currentRole,
  );

  const menuItems = useMemo(() => {
    const items = [
      { icon: Home, label: "Home", path: "/home" },
      { icon: Ticket, label: "Ticket", path: "/ticket" },
      { icon: LifeBuoy, label: "Support", path: "/support" },
    ];
    if (isPrivileged)
      items.push({ icon: Users, label: "Manage", path: "/manage" });
    if (currentRole === "super-admin" || currentRole === "admin")
      items.push({ icon: Building2, label: "Tenant", path: "/tenant" });
    items.push({ icon: Settings, label: "Settings", path: "/settings" });
    return items;
  }, [currentRole, isPrivileged]);

  const initials = useMemo(
    () =>
      account?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ?? "U",
    [account],
  );

  const handleNavigate = useCallback(
    (path) => {
      router.push(path);
      setShowLogout(false);
    },
    [router],
  );

  const handleLogout = useCallback(() => {
    instance.logoutRedirect({ postLogoutRedirectUri: "/" });
  }, [instance]);

  // ─── Mobile
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-[#111] border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between px-4 z-30">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6">
              <Image
                src="/icons/powerintakelogo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Power Intake
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none"
              style={{ backgroundColor: isDarkMode ? "#6366f1" : "#d1d5db" }}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  isDarkMode ? "translate-x-[22px]" : "translate-x-[2px]"
                }`}
              >
                {isDarkMode ? (
                  <Moon className="w-3 h-3 text-indigo-500" />
                ) : (
                  <Sun className="w-3 h-3 text-yellow-500" />
                )}
              </span>
            </button>

            <Notification isMobile />

            <div className="relative">
              <button
                onClick={() => setShowLogout((p) => !p)}
                className="relative w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white flex items-center justify-center text-sm font-semibold overflow-hidden"
              >
                {profilePhotoUrl ? (
                  <Image
                    src={profilePhotoUrl}
                    alt="Profile photo"
                    fill
                    sizes="32px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  initials
                )}
              </button>

              {showLogout && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLogout(false)}
                  />
                  <div
                    className="absolute right-0 top-10 w-56 bg-white dark:bg-[#242526] border border-gray-100 dark:border-white/[0.08] rounded-2xl z-50 overflow-hidden"
                    style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.10)" }}
                  >
                    <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                        {account?.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {roleLabel}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0">
                        <LogOut className="w-3.5 h-3.5" />
                      </div>
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111] border-t border-gray-100 dark:border-white/[0.06] z-30">
          <div className="flex justify-around h-16">
            {menuItems.map(({ icon: Icon, label, path }) => {
              const isActive = router.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => handleNavigate(path)}
                  className={`flex flex-col items-center justify-center flex-1 transition-colors ${
                    isActive
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="h-14" />
        <div className="h-16" />
      </>
    );
  }

  // ─── Desktop
  const sidebarWidth = isCollapsed ? "w-[70px]" : "w-64";

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-[#111] border-r border-gray-100 dark:border-white/[0.06] flex flex-col z-50 transition-[width] duration-300 ease-in-out ${sidebarWidth}`}
      >
        <div className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0 overflow-hidden">
          {isCollapsed ? (
            <div className="flex items-center justify-center w-full gap-1.5">
              <div className="relative w-6 h-6 flex-shrink-0">
                <Image
                  src="/icons/powerintakelogo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center flex-1 min-w-0">
                <div className="relative w-6 h-6 flex-shrink-0">
                  <Image
                    src="/icons/powerintakelogo.png"
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="ml-3 font-semibold text-gray-900 dark:text-white truncate">
                  Power Intake
                </span>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] flex-shrink-0 text-gray-500 dark:text-gray-400 transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1">
            {menuItems.map(({ icon: Icon, label, path }) => {
              const isActive = router.pathname === path;
              return (
                <li key={path}>
                  <button
                    onClick={() => handleNavigate(path)}
                    title={isCollapsed ? label : undefined}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                      isCollapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-gray-100 text-gray-900 dark:bg-white/[0.08] dark:text-white"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${!isCollapsed ? "mr-3" : ""}`}
                    />
                    {!isCollapsed && (
                      <span className="text-sm font-medium truncate">
                        {label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-100 dark:border-white/[0.06] p-3 space-y-2">
          <div
            className={`flex items-center px-3 py-2.5 rounded-lg overflow-hidden ${isCollapsed ? "justify-center" : "gap-3"}`}
          >
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none"
              style={{ backgroundColor: isDarkMode ? "#6366f1" : "#d1d5db" }}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  isDarkMode ? "translate-x-[22px]" : "translate-x-[2px]"
                }`}
              >
                {isDarkMode ? (
                  <Moon className="w-3 h-3 text-indigo-500" />
                ) : (
                  <Sun className="w-3 h-3 text-yellow-500" />
                )}
              </span>
            </button>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-tight">
                  {isDarkMode ? "Light mode" : "Dark mode"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Switch appearance
                </p>
              </div>
            )}
          </div>

          {/* <Notification isCollapsed={isCollapsed} /> */}

          <div className="relative">
            <button
              onClick={() => setShowLogout((p) => !p)}
              title={isCollapsed ? account?.name : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors overflow-hidden ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="relative w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white flex items-center justify-center text-sm font-semibold flex-shrink-0 overflow-hidden">
                {profilePhotoUrl ? (
                  <Image
                    src={profilePhotoUrl}
                    alt="Profile photo"
                    fill
                    sizes="32px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  initials
                )}
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {account?.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {roleLabel}
                  </p>
                </div>
              )}
            </button>

            {showLogout && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLogout(false)}
                />
                <div
                  className={`absolute bg-white dark:bg-[#242526] border border-gray-100 dark:border-white/[0.08] rounded-2xl z-50 overflow-hidden ${
                    isCollapsed
                      ? "left-full top-1/2 -translate-y-1/2 ml-3 w-36"
                      : "bottom-full left-0 mb-2 w-full"
                  }`}
                  style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.10)" }}
                >
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      <div className="fixed right-4 top-4 z-40">
        <Notification isDesktopFloating />
      </div>

      <div
        className={`flex-shrink-0 transition-[width] duration-300 ease-in-out ${sidebarWidth}`}
      />
    </>
  );
}
