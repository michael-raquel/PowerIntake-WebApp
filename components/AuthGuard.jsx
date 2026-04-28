import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { loginRequest, apiRequest } from "@/lib/msalConfig";
import { isRunningInTeams, bootstrapTeamsMsal } from "@/lib/teamsAuth";
import dynamic from "next/dynamic";
import AppNotificationBadgeSync from "@/components/AppNotificationBadgeSync";

const SideNavbar = dynamic(() => import("@/components/SideNavbar"), { ssr: false });

export default function AuthGuard({ children, requiredRoles, showSidebar }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts, inProgress } = useMsal();
  const router = useRouter();

  const [verified, setVerified] = useState(null);
  const [teamsChecked, setTeamsChecked] = useState(false);
  const [teamsAuthError, setTeamsAuthError] = useState(null);

  // ── Teams SSO bootstrap ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const tryTeamsAuth = async () => {
      const inTeams = await isRunningInTeams();

      if (!inTeams) {
        if (!cancelled) setTeamsChecked(true);
        return;
      }

      if (isAuthenticated) {
        if (!cancelled) setTeamsChecked(true);
        return;
      }

      try {
        // Fully silent — no popup, no redirect, no user interaction ever
        await bootstrapTeamsMsal(instance, loginRequest);
      } catch (err) {
        console.error("[TeamsAuth] Silent bootstrap failed:", err);
        if (!cancelled) setTeamsAuthError(err.message || "Teams authentication failed");
      } finally {
        if (!cancelled) setTeamsChecked(true);
      }
    };

    tryTeamsAuth();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Normal auth redirect (non-Teams only) ────────────────
  useEffect(() => {
    if (!teamsChecked) return;
    if (inProgress !== InteractionStatus.None) return;
    if (isAuthenticated) return;
    if (teamsAuthError) return;

    isRunningInTeams().then((inTeams) => {
      if (!inTeams) {
        instance.loginRedirect(loginRequest);
      }
    });
  }, [isAuthenticated, inProgress, instance, teamsChecked, teamsAuthError]);

  // ── Consent gate ─────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    if (inProgress !== InteractionStatus.None) return;

    const isVerified = sessionStorage.getItem("consent_verified") === "1";
    if (isVerified) {
      setTimeout(() => setVerified(true), 0);
    } else {
      router.replace("/checking");
    }
  }, [isAuthenticated, inProgress, router]);

  // ── Role check ───────────────────────────────────────────
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

  const loadingScreen = (message) => (
    <div className="flex min-h-screen items-center justify-center bg-black">
      {message ? (
        <p className="text-zinc-500 text-sm">{message}</p>
      ) : (
        <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
      )}
    </div>
  );

  if (teamsAuthError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black gap-3 px-6">
        <p className="text-red-400 text-sm text-center">Microsoft Teams sign-in failed.</p>
        <p className="text-zinc-600 text-xs text-center">{teamsAuthError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!teamsChecked) return loadingScreen(null);
  if (inProgress !== InteractionStatus.None) return loadingScreen(null);
  if (!isAuthenticated) return loadingScreen("Signing in...");
  if (verified !== true) return loadingScreen(null);
  if (requiredRoles?.length > 0 && !hasRequiredRole) return loadingScreen("Checking permissions...");

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300 w-full">
      <AppNotificationBadgeSync />
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