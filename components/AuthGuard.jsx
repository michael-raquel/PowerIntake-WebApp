import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { loginRequest } from "@/lib/msalConfig";
import dynamic from "next/dynamic";

const SideNavbar = dynamic(() => import("@/components/SideNavbar"), {
  ssr: false,
});

export default function AuthGuard({ children, requiredRoles, showSidebar }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const router = useRouter();

  const [verified, setVerified] = useState(null);

  // ── Auth redirect ───────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      instance.loginRedirect(loginRequest);
    }
  }, [isAuthenticated, instance]);

  // ── Consent gate ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const isVerified = sessionStorage.getItem("consent_verified") === "1";
    if (isVerified) {
      setVerified(true);
    } else {
      router.replace("/checking");
    }
  }, [isAuthenticated, router]);

  // ── Role check ──────────────────────────────────────────
  const hasRequiredRole = useMemo(() => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    const roles = (accounts[0]?.idTokenClaims?.roles ?? []).map(String);
    return requiredRoles.some((role) => roles.includes(role));
  }, [accounts, requiredRoles]);

  useEffect(() => {
    if (isAuthenticated && verified && requiredRoles?.length > 0 && !hasRequiredRole) {
      router.replace("/unauthorized");
    }
  }, [isAuthenticated, verified, requiredRoles, hasRequiredRole, router]);

  // ── Loading shell ────────────────────────────────────────
  const loadingScreen = (message) => (
    <div className="flex min-h-screen items-center justify-center bg-black">
      {message ? (
        <p className="text-zinc-500 text-sm">{message}</p>
      ) : (
        <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
      )}
    </div>
  );

  if (!isAuthenticated) return loadingScreen("Redirecting to Microsoft login...");
  if (verified !== true) return loadingScreen(null);
  if (requiredRoles?.length > 0 && !hasRequiredRole) return loadingScreen("Checking permissions...");

  // ── Verified: render full layout ─────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300 w-full">
      {showSidebar && <SideNavbar />}
      <main className="flex-1 min-h-0 overflow-y-auto">
        {showSidebar && <div className="md:hidden h-14" />}
        <div className={showSidebar ? "min-h-full pb-16 md:pb-0" : "min-h-full pb-0"}>
          {children}
        </div>
      </main>
    </div>
  );
}