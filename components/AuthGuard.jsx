import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { loginRequest } from "@/lib/msalConfig";
import dynamic from "next/dynamic";

const KNOWN_ROLES = ["SuperAdmin", "SystemAdmin", "Admin", "Manager", "User"];

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
    setTimeout(() => setVerified(true), 0);
  } else {
    router.replace("/checking");
  }
}, [isAuthenticated, router]);

  // ── Role check ──────────────────────────────────────────
  const tokenRoles = useMemo(
    () => (accounts[0]?.idTokenClaims?.roles ?? []).map(String),
    [accounts],
  );

  const hasKnownRole = useMemo(
    () => tokenRoles.some((role) => KNOWN_ROLES.includes(role)),
    [tokenRoles],
  );

  const hasRequiredRole = useMemo(() => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.some((role) => tokenRoles.includes(role));
  }, [requiredRoles, tokenRoles]);

  useEffect(() => {
    if (isAuthenticated && verified && !hasKnownRole) {
      router.replace("/no-consent?reason=unknown-user");
    }
  }, [isAuthenticated, verified, hasKnownRole, router]);

  useEffect(() => {
    if (
      isAuthenticated &&
      verified &&
      hasKnownRole &&
      requiredRoles?.length > 0 &&
      !hasRequiredRole
    ) {
      router.replace("/unauthorized");
    }
  }, [isAuthenticated, verified, hasKnownRole, requiredRoles, hasRequiredRole, router]);

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
  if (!hasKnownRole) return loadingScreen("Checking permissions...");
  if (requiredRoles?.length > 0 && !hasRequiredRole)
    return loadingScreen("Checking permissions...");

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