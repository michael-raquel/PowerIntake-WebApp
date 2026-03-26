import "@/styles/globals.css";
import { useEffect } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "@/lib/msalConfig";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "sonner";
import Clarity from "@microsoft/clarity";

const SideNavbar = dynamic(() => import("@/components/SideNavbar"), {
  ssr: false,
});
const AuthGuard = dynamic(() => import("@/components/AuthGuard"), {
  ssr: false,
});
const SpartaAssistWidget = dynamic(
  () => import("@/components/SpartaAssistWidget"),
  { ssr: false },
);

const msalInstance = new PublicClientApplication(msalConfig);
const noSidebarPages = ["/", "/register", "/login"];

// Optional route-level role restrictions (all non-public routes still require login)
const routeRoleMap = {
  "/manage": ["SuperAdmin", "SystemAdmin", "Manager"],
};

function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const isPublicPage = noSidebarPages.includes(router.pathname);
  const showSidebar = !isPublicPage;
  const requiredRoles = routeRoleMap[router.pathname] ?? [];

  // Optional: hide widget on offline page
  const hideAssistRoutes = ["/offline"];
  const showAssistWidget = !hideAssistRoutes.includes(router.pathname);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => console.log("[SW] Registered:", reg.scope))
        .catch((err) => console.error("[SW] Registration failed:", err));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
      if (clarityId) {
        Clarity.init(clarityId);
      } else {
        console.warn("Clarity ID is missing (NEXT_PUBLIC_CLARITY_PROJECT_ID)");
      }
    }
  }, []);

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <ThemeProvider>
            <div
              suppressHydrationWarning
              className={`flex min-h-dvh text-gray-900 dark:text-white transition-colors duration-300 ${
                isPublicPage ? "bg-black" : "bg-white dark:bg-black"
              } ${
                isPublicPage ? "overflow-x-hidden" : "h-screen overflow-hidden"
              }`}
            >
              {showSidebar && <SideNavbar />}
              <main
                className={`flex-1 min-h-0 ${
                  isPublicPage ? "overflow-y-auto" : "overflow-y-auto"
                } ${showSidebar ? "md:ml-0" : ""}`}
              >
                {showSidebar && <div className="md:hidden h-14" />}
                <div
                  className={
                    showSidebar ? "min-h-full pb-16 md:pb-0" : "min-h-full pb-0"
                  }
                >
                  {isPublicPage ? (
                    <Component {...pageProps} />
                  ) : (
                    <AuthGuard requiredRoles={requiredRoles}>
                      <Component {...pageProps} />
                    </AuthGuard>
                  )}
                </div>
              </main>
            </div>

            {showAssistWidget && (
              <SpartaAssistWidget hasMobileBottomNav={showSidebar} />
            )}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </MsalProvider>
    </NextThemeProvider>
  );
}

export default function App(props) {
  return <AppContent {...props} />;
}
