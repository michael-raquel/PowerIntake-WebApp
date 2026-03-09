import "@/styles/globals.css";
import { useEffect } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "@/lib/msalConfig";
import { useRouter } from "next/router";
import SideNavbar from "@/components/SideNavbar";

const msalInstance = new PublicClientApplication(msalConfig);

const noSidebarPages = ['/', '/register', '/login'];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const showSidebar = !noSidebarPages.includes(router.pathname);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => console.log("[SW] Registered:", reg.scope))
        .catch((err) => console.error("[SW] Registration failed:", err));
    }
  }, []);

  return (
    <MsalProvider instance={msalInstance}>
      <div className="flex h-screen overflow-hidden bg-white">
        {showSidebar && <SideNavbar />}
        
        <main 
          className={`
            flex-1 overflow-y-auto
            ${showSidebar ? 'md:ml-0' : ''}
          `}
        >
          {showSidebar && <div className="md:hidden h-14" />}
          
           <div className="min-h-full pb-16 md:pb-0">
            <Component {...pageProps} />
          </div>
        </main>
      </div>
    </MsalProvider>
  );
}