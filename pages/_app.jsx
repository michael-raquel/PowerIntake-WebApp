import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { msalConfig } from "@/lib/msalConfig";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ThemeProvider } from "@/context/ThemeContext";
import { SpartaAssistProvider, useSpartaAssist } from "@/context/SpartaAssistContext";
import { Toaster } from "sonner";
import Clarity from "@microsoft/clarity";

const AuthGuard = dynamic(() => import("@/components/AuthGuard"), { ssr: false });
const SpartaAssistWidget = dynamic(() => import("@/components/SpartaAssistWidget"), { ssr: false });

const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.addEventCallback((event) => {
  if (
    event.eventType === EventType.LOGIN_SUCCESS &&
    event.payload?.account
  ) {
    const account = event.payload.account;
    sessionStorage.setItem(
      "msal_consent_account",
      JSON.stringify({
        homeAccountId: account.homeAccountId,
        localAccountId: account.localAccountId,
        username: account.username,
        tenantId: account.tenantId,
      }),
    );
  }
});

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
  "/tenant": ["SuperAdmin", "Admin"],
};

function SpartaAssistWidgetWithEmail({ hasMobileBottomNav }) {
  const { accounts } = useMsal();
  const email = accounts[0]?.username ?? "";
  return <SpartaAssistWidget hasMobileBottomNav={hasMobileBottomNav} userEmail={email} />;
}

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
      if (clarityId) Clarity.init(clarityId);
    }
  }, []);

  // ── Teams SDK initialization ─────────────────────────────
  // Initialize early so Teams context is available to AuthGuard.
  // This is intentionally non-blocking — failure is silently swallowed
  // since the app also runs outside Teams.
  useEffect(() => {
    if (typeof window === "undefined" || window.self === window.top) return;

    const initTeams = async () => {
      try {
        const { app } = await import("@microsoft/teams-js");
        await app.initialize();
        console.log("[Teams] SDK initialized");

        // Notify Teams that the app is ready (removes loading indicator)
        //app.notifySuccess();
      } catch {
        // Silently ignore — not running inside Teams
      }
    };

    void initTeams();
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
              <SpartaAssistWidgetWithEmail hasMobileBottomNav={showSidebar} />
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
              <AppContent {...props} />
            </SpartaAssistProvider>
          </ThemeProvider>
        </AuthProvider>
      </MsalProvider>
    </NextThemeProvider>
  );
}