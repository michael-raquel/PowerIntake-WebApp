import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { loginRequest, apiRequest } from "@/lib/msalConfig";
import { isRunningInTeams, getTeamsClientToken } from "@/lib/teamsAuth";
import dynamic from "next/dynamic";
import AppNotificationBadgeSync from "@/components/AppNotificationBadgeSync";

const SideNavbar = dynamic(() => import("@/components/SideNavbar"), {
  ssr: false,
});

export default function AuthGuard({ children, requiredRoles, showSidebar }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts, inProgress } = useMsal();
  const router = useRouter();

  const [verified, setVerified] = useState(null);
  const [teamsChecked, setTeamsChecked] = useState(false);
  const [teamsAuthError, setTeamsAuthError] = useState(null);

  // ── Teams SSO bootstrap ──────────────────────────────────
  // Runs once on mount. If we're inside Teams, attempt silent SSO
  // using the Teams client token as a loginHint seed.
  // This must run BEFORE the normal auth redirect effect below.
  useEffect(() => {
    let cancelled = false;

    const tryTeamsAuth = async () => {
      const inTeams = await isRunningInTeams();

      if (!inTeams) {
        if (!cancelled) setTeamsChecked(true);
        return;
      }

      // Already authenticated via MSAL cache — nothing to do
      if (isAuthenticated) {
        if (!cancelled) setTeamsChecked(true);
        return;
      }

      try {
        // Get the Teams-issued token to extract the user's UPN (loginHint)
        const teamsToken = await getTeamsClientToken();

        // Decode the JWT to get the preferred_username / upn claim
        const payload = JSON.parse(atob(teamsToken.split(".")[1]));
        const loginHint =
          payload.preferred_username || payload.upn || payload.unique_name;

        if (!loginHint) throw new Error("No loginHint in Teams token");

        // Try MSAL ssoSilent first — works if the user's session cookie exists
        try {
          await instance.ssoSilent({
            ...loginRequest,
            loginHint,
          });
          // ssoSilent succeeded — MSAL cache is now populated, isAuthenticated
          // will flip to true on the next render cycle
        } catch (ssoErr) {
          // ssoSilent failed (no session cookie in Teams webview).
          // Fall back to acquireTokenPopup which Teams allows in a child window.
          console.warn("[TeamsAuth] ssoSilent failed, trying popup:", ssoErr.errorCode);
          await instance.loginPopup({
            ...loginRequest,
            loginHint,
          });
        }
      } catch (err) {
        console.error("[TeamsAuth] Teams SSO failed:", err);
        if (!cancelled) setTeamsAuthError(err.message || "Teams authentication failed");
      } finally {
        if (!cancelled) setTeamsChecked(true);
      }
    };

    tryTeamsAuth();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount

  // ── Normal auth redirect (non-Teams) ────────────────────
  useEffect(() => {
    if (!teamsChecked) return; // wait for Teams check to complete
    if (inProgress !== InteractionStatus.None) return;
    if (isAuthenticated) return;
    if (teamsAuthError) return; // don't redirect if Teams auth is pending/failed

    // Only call loginRedirect if we're NOT in Teams
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

  // ── Loading shell ─────────────────────────────────────────
  const loadingScreen = (message) => (
    <div className="flex min-h-screen items-center justify-center bg-black">
      {message ? (
        <p className="text-zinc-500 text-sm">{message}</p>
      ) : (
        <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
      )}
    </div>
  );

  // Show error state if Teams auth failed completely
  if (teamsAuthError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black gap-3 px-6">
        <p className="text-red-400 text-sm text-center">
          Microsoft Teams sign-in failed.
        </p>
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

  // Wait for Teams detection to complete before deciding what to render
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