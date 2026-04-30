// AuthGuard.jsx — Teams Store App
//
// Key behaviors:
//   - Teams SSO via OBO (no ssoSilent/acquireTokenSilent hidden iframe)
//   - teamsAuthenticated sessionStorage flag bypasses MSAL isAuthenticated
//   - 20s timeout with error state if bootstrap hangs
//   - Consent gate only runs AFTER teamsChecked is set

import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { loginRequest } from "@/lib/msalConfig";
import { isRunningInTeams, bootstrapTeamsMsal } from "@/lib/teamsAuth";
import dynamic from "next/dynamic";
import AppNotificationBadgeSync from "@/components/AppNotificationBadgeSync";

const SideNavbar = dynamic(() => import("@/components/SideNavbar"), { ssr: false });

const BOOTSTRAP_TIMEOUT_MS = 20_000;

export default function AuthGuard({ children, requiredRoles, showSidebar }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts, inProgress } = useMsal();
  const router = useRouter();

  const [verified, setVerified]             = useState(null);
  const [teamsChecked, setTeamsChecked]     = useState(false);
  const [teamsAuthError, setTeamsAuthError] = useState(null);
  const [timedOut, setTimedOut]             = useState(false);
  const [debugInfo, setDebugInfo]           = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const cancelledRef   = useRef(false);
  const timerRef       = useRef(null);
  const countdownRef   = useRef(null);

  // ── Teams SSO bootstrap ────────────────────────────────────────────────────
  useEffect(() => {
    cancelledRef.current = false;

    // 20s timeout watchdog
    timerRef.current = setTimeout(() => {
      if (!cancelledRef.current) {
        console.error("[AuthGuard] ⏰ Bootstrap timed out after 20s");
        setTimedOut(true);
        setTeamsAuthError(
          "Authentication timed out after 20 seconds. This usually means the Teams SDK " +
          "could not reach Microsoft's auth endpoint, or admin consent has not been granted."
        );
        setDebugInfo({
          failedAt: "bootstrap_timeout",
          error: "20s watchdog fired",
          origin: typeof window !== "undefined" ? window.location.origin : "unknown",
          time: new Date().toISOString(),
        });
        setTeamsChecked(true);
      }
    }, BOOTSTRAP_TIMEOUT_MS);

    // Elapsed seconds counter for UX
    let secs = 0;
    countdownRef.current = setInterval(() => {
      secs += 1;
      setElapsedSeconds(secs);
    }, 1000);

    const tryTeamsAuth = async () => {
      console.log("[AuthGuard] Checking Teams environment…");

      const inTeams = await isRunningInTeams();
      console.log("[AuthGuard] isRunningInTeams →", inTeams);

      if (!inTeams) {
        clearTimeout(timerRef.current);
        clearInterval(countdownRef.current);
        if (!cancelledRef.current) setTeamsChecked(true);
        return;
      }

      if (isAuthenticated) {
        console.log("[AuthGuard] Already MSAL-authenticated — skipping bootstrap");
        clearTimeout(timerRef.current);
        clearInterval(countdownRef.current);
        if (!cancelledRef.current) setTeamsChecked(true);
        return;
      }

      // Check if OBO already ran this session (page reload inside Teams)
      const alreadyDone = sessionStorage.getItem("teams_authenticated") === "1";
      if (alreadyDone) {
        console.log("[AuthGuard] teams_authenticated already set — skipping bootstrap");
        clearTimeout(timerRef.current);
        clearInterval(countdownRef.current);
        if (!cancelledRef.current) setTeamsChecked(true);
        return;
      }

      console.log("[AuthGuard] In Teams — running bootstrapTeamsMsal (OBO)…");

      try {
        await bootstrapTeamsMsal(instance, loginRequest);
        console.log("[AuthGuard] ✅ bootstrapTeamsMsal completed");
      } catch (err) {
        const msg = err?.message ?? "Teams authentication failed";
        console.error("[AuthGuard] ❌ bootstrapTeamsMsal threw:", msg);

        if (!cancelledRef.current) {
          setDebugInfo(
            err?.debugInfo ?? {
              error: msg,
              origin: typeof window !== "undefined" ? window.location.origin : "unknown",
              clientId: "6ccf8b01-7af5-497b-9e23-45a92d68a226",
              time: new Date().toISOString(),
            }
          );
          setTeamsAuthError(msg);
        }
      } finally {
        clearTimeout(timerRef.current);
        clearInterval(countdownRef.current);
        if (!cancelledRef.current) setTeamsChecked(true);
      }
    };

    tryTeamsAuth();

    return () => {
      cancelledRef.current = true;
      clearTimeout(timerRef.current);
      clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Normal auth redirect (browser only) ───────────────────────────────────
  useEffect(() => {
    if (!teamsChecked) return;
    if (inProgress !== InteractionStatus.None) return;
    if (isAuthenticated) return;
    if (teamsAuthError) return;

    const teamsAuthenticated = sessionStorage.getItem("teams_authenticated") === "1";
    if (teamsAuthenticated) return;

    isRunningInTeams().then((inTeams) => {
      if (!inTeams) {
        console.log("[AuthGuard] Not in Teams — redirecting to loginRedirect");
        instance.loginRedirect(loginRequest);
      }
    });
  }, [isAuthenticated, inProgress, instance, teamsChecked, teamsAuthError]);

  // ── Consent gate ───────────────────────────────────────────────────────────
  // Only runs after teamsChecked=true so sessionStorage flags are definitely set.
  useEffect(() => {
    if (!teamsChecked) return; // ← wait for bootstrap to finish
    if (inProgress !== InteractionStatus.None) return;

    const teamsAuthenticated = sessionStorage.getItem("teams_authenticated") === "1";

    if (!isAuthenticated && !teamsAuthenticated) return;

    const isVerified = sessionStorage.getItem("consent_verified") === "1";
    if (isVerified) {
      setTimeout(() => setVerified(true), 0);
    } else {
      console.log("[AuthGuard] consent_verified not set — routing to /checking");
      router.replace("/checking");
    }
  }, [isAuthenticated, inProgress, teamsChecked, router]);

  // ── Role check ─────────────────────────────────────────────────────────────
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

  // ── Shared loading screen ──────────────────────────────────────────────────
  const loadingScreen = (message) => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
      {message && <p className="text-zinc-500 text-sm">{message}</p>}
      {elapsedSeconds >= 5 && (
        <p className="text-zinc-700 text-xs">
          Still working… ({elapsedSeconds}s)
        </p>
      )}
    </div>
  );

  // ── Teams auth error / timeout screen ─────────────────────────────────────
  if (teamsAuthError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black gap-4 px-6 text-center max-w-md mx-auto">
        <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <span className="text-red-400 text-lg">!</span>
        </div>

        <div className="space-y-1">
          <p className="text-red-400 text-sm font-medium">
            {timedOut ? "Authentication timed out" : "Microsoft Teams sign-in failed"}
          </p>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">{teamsAuthError}</p>
        </div>

        <div className="w-full border border-zinc-800 rounded-lg p-3 text-left space-y-1.5">
          <p className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
            Things to check
          </p>
          {[
            "Admin consent has been granted for this app in your tenant",
            "The Teams app manifest includes the correct webApplicationInfo",
            "Your validDomains list covers this app's domain",
            "The Azure app exposes api://CLIENT_ID/access_as_user scope",
            "AZURE_CLIENT_SECRET is set on the backend and not expired",
            "The /teamsauth/obo-exchange endpoint is reachable from Teams",
            "NEXT_PUBLIC_API_BASE_URL is set correctly in the frontend env",
          ].map((tip, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-zinc-600 text-[10px] mt-0.5">•</span>
              <span className="text-zinc-600 text-[10px] leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>

        {debugInfo && (
          <details className="w-full">
            <summary className="text-zinc-700 text-[10px] cursor-pointer hover:text-zinc-500 transition-colors">
              Show debug info
            </summary>
            <pre className="mt-2 text-left text-[9px] text-zinc-600 bg-zinc-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}

        <button
          onClick={() => {
            sessionStorage.removeItem("teams_authenticated");
            sessionStorage.removeItem("teams_obo_token");
            sessionStorage.removeItem("teams_obo_expires_at");
            window.location.reload();
          }}
          className="mt-1 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors"
        >
          Retry
        </button>

        <p className="text-zinc-700 text-[10px]">
          If this persists, contact your IT administrator.
        </p>
      </div>
    );
  }

  // ── Loading gates ──────────────────────────────────────────────────────────
  const teamsAuthenticated =
    typeof window !== "undefined" &&
    sessionStorage.getItem("teams_authenticated") === "1";

  if (!teamsChecked)                                          return loadingScreen(null);
  if (inProgress !== InteractionStatus.None)                  return loadingScreen(null);
  if (!isAuthenticated && !teamsAuthenticated)                return loadingScreen("Signing in…");
  if (verified !== true)                                      return loadingScreen(null);
  if (requiredRoles?.length > 0 && !hasRequiredRole)         return loadingScreen("Checking permissions…");

  // ── Authenticated layout ───────────────────────────────────────────────────
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