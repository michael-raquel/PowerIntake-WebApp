import "@/styles/globals.css";
import { useEffect } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "@/lib/msalConfig";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner"; 

const SideNavbar = dynamic(() => import("@/components/SideNavbar"), { ssr: false });

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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <div suppressHydrationWarning className="flex h-screen overflow-hidden bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
            {showSidebar && <SideNavbar />}
            <main className={`flex-1 overflow-y-auto ${showSidebar ? 'md:ml-0' : ''}`}>
              {showSidebar && <div className="md:hidden h-14" />}
              <div className="min-h-full pb-16 md:pb-0">
                <Component {...pageProps} />
              </div>
            </main>
          </div>
           <Toaster />
        </AuthProvider>
      </MsalProvider>
    </ThemeProvider>
  );
}