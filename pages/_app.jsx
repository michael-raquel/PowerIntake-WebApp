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
import {
  SpartaAssistProvider,
  useSpartaAssist,
} from "@/context/SpartaAssistContext";
import { Toaster } from "sonner";
import Clarity from "@microsoft/clarity";

const AuthGuard = dynamic(() => import("@/components/AuthGuard"), {
  ssr: false,
});
const SpartaAssistWidget = dynamic(
  () => import("@/components/SpartaAssistWidget"),
  { ssr: false },
);

const msalInstance = new PublicClientApplication(msalConfig);

const noSidebarPages = [
  "/",
  "/register",
  "/login",
  "/checking",
  "/consent-callback",
  "/ms-consent-callback",
  "/unauthorized",
  "/no-consent",
];

const routeRoleMap = {
  "/manage": ["SuperAdmin", "SystemAdmin", "Admin", "Manager"],
  "/tenant": ["SuperAdmin"],
};

function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const { spartaAssistEnabled } = useSpartaAssist();
  const isPublicPage = noSidebarPages.includes(router.pathname);
  const showSidebar = !isPublicPage;
  const requiredRoles = routeRoleMap[router.pathname] ?? [];

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

  const shouldShowWidget = spartaAssistEnabled === true && !isPublicPage;

  return (
    <>
      {isPublicPage ? (
        <div className="min-h-dvh bg-black overflow-x-hidden">
          <Component {...pageProps} />
        </div>
      ) : (
        <AuthGuard requiredRoles={requiredRoles} showSidebar={showSidebar}>
          <>
            <Component {...pageProps} />
            {shouldShowWidget && (
              <SpartaAssistWidget hasMobileBottomNav={showSidebar} />
            )}
          </>
        </AuthGuard>
      )}
      <Toaster />
    </>
  );
}

export default function App(props) {
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
            <SpartaAssistProvider>
              {" "}
              {/* ← now inside AuthProvider */}
              <AppContent {...props} />
            </SpartaAssistProvider>
          </ThemeProvider>
        </AuthProvider>
      </MsalProvider>
    </NextThemeProvider>
  );
}
