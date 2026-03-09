import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Home,
  Ticket,
  LifeBuoy,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import Image from 'next/image';
import { useMsal } from "@azure/msal-react";

const SideNavbar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const { instance, accounts } = useMsal();
  const router = useRouter();

  const account = accounts[0];
  const currentRole = router.pathname.split('/')[1];
  
  const initials = account?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) setIsCollapsed(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setShowLogout(false);
  }, [router.pathname]);

  const getMenuItems = () => {
    const baseItems = [
      { icon: Home, label: 'Home', path: `/${currentRole}/home` },
      { icon: Ticket, label: 'Ticket', path: `/${currentRole}/ticket` },
      { icon: LifeBuoy, label: 'Support', path: `/${currentRole}/support` },
    ];

    if (['manager', 'system-admin', 'super-admin'].includes(currentRole)) {
      baseItems.push({ icon: Users, label: 'Manage', path: `/${currentRole}/manage` });
    }

    baseItems.push({ icon: Settings, label: 'Settings', path: `/${currentRole}/settings` });

    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: "/" });
  };

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30">
          <div className="flex items-center">
            <div className="relative w-6 h-6 mr-2">
              <Image src="/icons/powerintakelogo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="font-semibold">Power Intake</span>
          </div>

          <div className="relative">
            <button onClick={() => setShowLogout(!showLogout)} className="w-8 h-8 rounded-full overflow-hidden">
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                {initials}
              </div>
            </button>

            {showLogout && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLogout(false)} />
                <div className="absolute right-0 top-10 w-64 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-4 border-b">
                    <p className="font-medium">{account?.name}</p>
                    <p className="text-sm text-gray-500 truncate">{account?.username}</p>
                  </div>
                  <button onClick={handleLogout} 
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-30">
          <div className="flex justify-around h-16">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.path;
              return (
                <button key={item.path} onClick={() => router.push(item.path)} 
                  className={`flex flex-col items-center justify-center flex-1 ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        <div className="h-14" /><div className="h-16" />
      </>
    );
  }

  // Desktop View
  return (
    <>
      <aside className={`fixed top-0 left-0 h-screen bg-white border-r transition-all duration-300 z-50 
        ${isCollapsed ? 'w-[70px]' : 'w-64'} flex flex-col`}>
        
        <div className="h-14 flex items-center px-4 border-b flex-shrink-0">
          <div className="flex items-center flex-1">
            <div className="relative w-6 h-6">
              <Image src="/icons/powerintakelogo.png" alt="Logo" fill className="object-contain" />
            </div>
            {!isCollapsed && <span className="ml-3 font-semibold">Power Intake</span>}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 hover:bg-gray-100 rounded-lg">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.path;
              return (
                <li key={item.path}>
                  <button onClick={() => router.push(item.path)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors
                      ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}
                      ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.label : undefined}>
                    <Icon className={`w-5 h-5 ${!isCollapsed ? 'mr-3' : ''}`} />
                    {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t p-3">
          <div className="relative">
            <button onClick={() => setShowLogout(!showLogout)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50
                ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {initials}
                </div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{account?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{account?.username}</p>
                </div>
              )}
            </button>

            {showLogout && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLogout(false)} />
                <div className={`absolute bg-white rounded-lg shadow-lg border z-50
                  ${isCollapsed 
                    ? 'left-full top-1/2 -translate-y-1/2 ml-2 w-40' 
                    : 'bottom-full left-0 mb-2 w-48'}`}>
                  <button onClick={handleLogout} 
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {isCollapsed && (
          <style jsx>{`button[title]:hover::after {
            content: attr(title); position: absolute; left: 100%; top: 50%; transform: translateY(-50%);
            background: #1f2937; color: white; font-size: 0.75rem; padding: 0.25rem 0.5rem;
            border-radius: 0.375rem; white-space: nowrap; margin-left: 0.5rem; z-index: 60;
          }`}</style>
        )}
      </aside>
      <div className={isCollapsed ? 'w-[70px]' : 'w-64'} />
    </>
  );
};

export default SideNavbar;