// AuthGuard.jsx — Fixed for Teams Store App
// Changes:
//   - teamsAuthError now receives the full error message from bootstrapTeamsMsal
//   - Error UI shows actionable diagnosis hints
//   - Debug info panel in dev mode
//   - Teams check no longer re-triggers on every isAuthenticated change

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

  const [verified, setVerified]           = useState(null);
  const [teamsChecked, setTeamsChecked]   = useState(false);
  const [teamsAuthError, setTeamsAuthError] = useState(null);
  const [debugInfo, setDebugInfo]         = useState(null); // dev-mode only

  // ── Teams SSO bootstrap ──────────────────────────────────────────────────
  useEffect(() => {
    // Only run once — guard against re-runs on isAuthenticated changes
    if (teamsChecked) return;

    let cancelled = false;

    const tryTeamsAuth = async () => {
      console.log("[AuthGuard] Checking Teams environment…");

      const inTeams = await isRunningInTeams();
      console.log("[AuthGuard] isRunningInTeams →", inTeams);

      if (!inTeams) {
        if (!cancelled) setTeamsChecked(true);
        return;
      }

      if (isAuthenticated) {
        console.log("[AuthGuard] Already authenticated — skipping bootstrap");
        if (!cancelled) setTeamsChecked(true);
        return;
      }

      console.log("[AuthGuard] In Teams, not authenticated — running bootstrapTeamsMsal…");

      try {
        await bootstrapTeamsMsal(instance, loginRequest);
        console.log("[AuthGuard] ✅ bootstrapTeamsMsal completed");
     // In the catch block inside tryTeamsAuth:
} catch (err) {
  const msg = err?.message ?? "Teams authentication failed";
  if (!cancelled) {
    setDebugInfo({
      error: msg,
      origin: window.location.origin,
      clientId: "6ccf8b01-7af5-497b-9e23-45a92d68a226",
      time: new Date().toISOString(),
      authLog: err?.authLog ?? [],   // ← NEW
    });
    setTeamsAuthError(msg);
  }
}finally {
        if (!cancelled) setTeamsChecked(true);
      }
    };

    tryTeamsAuth();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← intentionally empty — run exactly once on mount

  // ── Normal auth redirect (browser / non-Teams only) ──────────────────────
  useEffect(() => {
    if (!teamsChecked) return;
    if (inProgress !== InteractionStatus.None) return;
    if (isAuthenticated) return;
    if (teamsAuthError) return;

    isRunningInTeams().then((inTeams) => {
      if (!inTeams) {
        console.log("[AuthGuard] Not in Teams — redirecting to loginRedirect");
        instance.loginRedirect(loginRequest);
      }
    });
  }, [isAuthenticated, inProgress, instance, teamsChecked, teamsAuthError]);

  // ── Consent gate ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    if (inProgress !== InteractionStatus.None) return;

    const isVerified = sessionStorage.getItem("consent_verified") === "1";
    if (isVerified) {
      setTimeout(() => setVerified(true), 0);
    } else {
      console.log("[AuthGuard] consent_verified not set — routing to /checking");
      router.replace("/checking");
    }
  }, [isAuthenticated, inProgress, router]);

  // ── Role check ────────────────────────────────────────────────────────────
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

  // ── Shared loading screen ─────────────────────────────────────────────────
  const loadingScreen = (message) => (
    <div className="flex min-h-screen items-center justify-center bg-black">
      {message ? (
        <p className="text-zinc-500 text-sm">{message}</p>
      ) : (
        <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
      )}
    </div>
  );

  // ── Teams auth error screen ───────────────────────────────────────────────
  if (teamsAuthError) {
    const isDev = process.env.NODE_ENV === "development";

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black gap-4 px-6 text-center max-w-md mx-auto">
        <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <span className="text-red-400 text-lg">!</span>
        </div>

        <div className="space-y-1">
          <p className="text-red-400 text-sm font-medium">Microsoft Teams sign-in failed</p>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">{teamsAuthError}</p>
        </div>

        <div className="w-full border border-zinc-800 rounded-lg p-3 text-left space-y-1.5">
          <p className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider">Things to check</p>
          {[
            "Admin consent has been granted for this app in your tenant",
            "The Teams app manifest includes the correct webApplicationInfo",
            "Your validDomains list covers this app's domain",
            "The Azure app exposes api://CLIENT_ID/access_as_user scope",
          ].map((tip, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-zinc-600 text-[10px] mt-0.5">•</span>
              <span className="text-zinc-600 text-[10px] leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>

      {debugInfo?.authLog?.length > 0 && (
  <div className="w-full">
    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-t-lg px-3 py-2">
      <span className="text-zinc-500 text-[10px]">Auth trace</span>
      <span className="text-zinc-700 text-[9px]">{debugInfo.authLog.length} events</span>
    </div>
    <div className="bg-zinc-950 border border-zinc-800 border-t-0 rounded-b-lg p-3 max-h-48 overflow-y-auto space-y-2">
      {debugInfo.authLog.map((entry, i) => (
        <div key={i} className="flex gap-2 items-start font-mono">
          <span className="text-zinc-700 text-[9px] whitespace-nowrap shrink-0">{entry.t}</span>
          <span className={`text-[8px] px-1.5 py-0.5 rounded shrink-0 mt-0.5 font-medium ${
            entry.level === "error" ? "bg-red-500/10 text-red-400" :
            entry.level === "warn"  ? "bg-yellow-500/10 text-yellow-400" :
            "bg-blue-500/10 text-blue-400"
          }`}>{entry.level}</span>
          <div>
            <div className="text-zinc-500 text-[9px] leading-relaxed">{entry.msg}</div>
            {entry.detail && (
              <div className="text-zinc-700 text-[9px] mt-0.5 break-all">
                {typeof entry.detail === "string" ? entry.detail : JSON.stringify(entry.detail)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        <button
          onClick={() => {
            // Clear cached Teams detection so retry works fresh
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

  // ── Loading gates ─────────────────────────────────────────────────────────
  if (!teamsChecked)                                              return loadingScreen(null);
  if (inProgress !== InteractionStatus.None)                     return loadingScreen(null);
  if (!isAuthenticated)                                          return loadingScreen("Signing in…");
  if (verified !== true)                                         return loadingScreen(null);
  if (requiredRoles?.length > 0 && !hasRequiredRole)            return loadingScreen("Checking permissions…");

  // ── Authenticated layout ──────────────────────────────────────────────────
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