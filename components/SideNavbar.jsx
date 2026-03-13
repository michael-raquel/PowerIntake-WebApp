import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import {Home,Ticket,LifeBuoy,Users,Settings,Sun,Moon,ChevronLeft,ChevronRight,LogOut} from 'lucide-react';
import Image from 'next/image';
import { useMsal } from "@azure/msal-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";

const MOBILE_BREAKPOINT = 768;
const SIDEBAR_COLLAPSED = 'w-[70px]';
const SIDEBAR_EXPANDED = 'w-64';

export default function SideNavbar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const { instance } = useMsal();
  const { tokenInfo } = useAuth();
  const { setTheme, resolvedTheme } = useTheme(); 
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return; 
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(false);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleRouteChange = () => setShowLogout(false);
    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [router.events]);

  const account = tokenInfo?.account;
  
  const currentRole = useMemo(() => {
    const roles = account?.roles ?? [];
    if (roles.includes('SuperAdmin')) return 'super-admin';
    if (roles.includes('SystemAdmin')) return 'system-admin';
    if (roles.includes('Manager')) return 'manager';
    return 'user';
  }, [account]);

  const menuItems = useMemo(() => {
    const items = [
      { icon: Home, label: 'Home', path: `/${currentRole}/home` },
      { icon: Ticket, label: 'Ticket', path: `/${currentRole}/ticket` },
      { icon: LifeBuoy, label: 'Support', path: `/${currentRole}/support` },
    ];
    
    if (['manager', 'system-admin', 'super-admin'].includes(currentRole)) {
      items.push({ icon: Users, label: 'Manage', path: `/${currentRole}/manage` });
    }
    
    items.push({ icon: Settings, label: 'Settings', path: `/${currentRole}/settings` });
    return items;
  }, [currentRole]);

  const initials = useMemo(() => 
    account?.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? 'U' 
  , [account]);

  const isDarkMode = resolvedTheme === 'dark';

  const handleNavigate = useCallback((path) => {
    router.push(path);
    setShowLogout(false);
  }, [router]);

  const handleLogout = useCallback(() => {
    instance.logoutRedirect({ postLogoutRedirectUri: "/" });
  }, [instance]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Mobile View
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 dark:bg-black dark:border-gray-800 flex items-center justify-between px-4 z-30 transition-colors duration-300">
          <div className="flex items-center">
            <div className="relative w-6 h-6 mr-2">
              <Image src="/icons/powerintakelogo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Power Intake</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors duration-300"
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLogout(!showLogout)}
                className="w-8 h-8 rounded-full overflow-hidden"
              >
                <div className="w-full h-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-white flex items-center justify-center text-sm font-medium">
                  {initials}
                </div>
              </button>

              {showLogout && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLogout(false)} />
                  <div className="absolute right-0 top-10 w-64 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-black dark:border-gray-800 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                      <p className="font-medium text-gray-900 dark:text-white">{account?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{account?.username}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-red-400"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 dark:bg-black dark:border-gray-800 z-30">
          <div className="flex justify-around h-16">
            {menuItems.map(({ icon: Icon, label, path }) => {
              const isActive = router.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => handleNavigate(path)}
                  className={`flex flex-col items-center justify-center flex-1 transition-colors ${
                    isActive
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
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

  // Desktop View
  return (
    <>
      <aside className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 dark:bg-black dark:border-gray-800 transition-all duration-300 z-50 flex flex-col overflow-hidden
        ${isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED}`}>
        
        <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center flex-1 min-w-0">
            <div className="relative w-6 h-6 flex-shrink-0">
              <Image src="/icons/powerintakelogo.png" alt="Logo" fill className="object-contain" />
            </div>
            {!isCollapsed && (
              <span className="ml-3 font-semibold text-gray-900 dark:text-white truncate">Power Intake</span>
            )}
          </div>
          <button
            onClick={toggleCollapse}
            className="ml-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg flex-shrink-0"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map(({ icon: Icon, label, path }) => {
              const isActive = router.pathname === path;
              return (
                <li key={path}>
                  <button
                    onClick={() => handleNavigate(path)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors
                      ${isActive
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900'}
                      ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? label : undefined}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                    {!isCollapsed && <span className="text-sm font-medium truncate">{label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-2">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800
              ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? (isDarkMode ? 'Light mode' : 'Dark mode') : undefined}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{isDarkMode ? 'Light mode' : 'Dark mode'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Switch appearance</p>
              </div>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowLogout(!showLogout)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900
                ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? account?.name : undefined}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                {initials}
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{account?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{account?.username}</p>
                </div>
              )}
            </button>

            {showLogout && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLogout(false)} />
                <div className={`absolute bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-black dark:border-gray-800 z-50
                  ${isCollapsed
                    ? 'left-full top-1/2 -translate-y-1/2 ml-2 w-40'
                    : 'bottom-full left-0 mb-2 w-48'}`}>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      <div className={`flex-shrink-0 transition-all duration-300 ${isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED}`} />
    </>
  );
}