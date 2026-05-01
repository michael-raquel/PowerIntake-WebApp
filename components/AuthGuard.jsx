// AuthGuard.jsx — Teams Store App
//
// Key behaviors:
//   - Teams SSO runs once on mount via bootstrapTeamsMsal (OBO flow)
//   - Early exit if valid OBO token already in sessionStorage (skips full OBO)
//   - teamsAuthenticated flag (sessionStorage) allows bypass of MSAL isAuthenticated
//     for Teams desktop where acquireTokenSilent/ssoSilent always times out
//   - Normal browser flow still uses MSAL loginRedirect as before
//   - 10s timeout on Teams bootstrap — shows dev console on failure

import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { loginRequest } from "@/lib/msalConfig";
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
  const [teamsTimedOut, setTeamsTimedOut] = useState(false);
  const [debugInfo, setDebugInfo]         = useState(null);
  const [logs, setLogs]                   = useState([]);

  const addLog = useCallback((level, msg, data = null) => {
    const entry = {
      time: new Date().toLocaleTimeString("en-US", {
        hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
      }),
      level,
      msg,
      data: data ? JSON.stringify(data, null, 2) : null,
    };
    setLogs(prev => [...prev, entry]);
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `[AuthGuard] ${msg}`, data ?? ""
    );
  }, []);

  // ── Teams SSO bootstrap ────────────────────────────────────────────────────
  useEffect(() => {
    if (teamsChecked) return;

    let cancelled = false;

    const tryTeamsAuth = async () => {
      addLog("info", "Checking Teams environment...");
      const inTeams = await isRunningInTeams();
      addLog("info", `isRunningInTeams → ${inTeams}`);

      if (!inTeams) {
        if (!cancelled) setTeamsChecked(true);
        return;
      }

      if (isAuthenticated) {
        addLog("info", "Already MSAL-authenticated — skipping bootstrap");
        if (!cancelled) setTeamsChecked(true);
        return;
      }

      addLog("info", "In Teams — checking for existing valid OBO token...");
      addLog("info", `Origin: ${typeof window !== "undefined" ? window.location.origin : "unknown"}`);
      addLog("info", `User agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "unknown"}`);

      // ── Early exit: valid OBO token already present ──────────────────────
      // Handles page reloads where sessionStorage survived but consent_verified
      // was wiped by the AuthContext logout cleanup (which fires when MSAL loses
      // the account on Teams desktop). Re-stamp both flags and skip the OBO flow
      // entirely — this is what was causing the 10s timeout on reload.
      const existingOboToken = sessionStorage.getItem("teams_obo_token");
      const oboExpiresAt     = Number(sessionStorage.getItem("teams_obo_expires_at") ?? 0);
      const oboStillValid    = existingOboToken && Date.now() < oboExpiresAt;

      if (oboStillValid) {
        addLog("info", `Valid OBO token found (expires ${new Date(oboExpiresAt).toISOString()}) — re-stamping auth flags, skipping bootstrap`);
        sessionStorage.setItem("teams_authenticated", "1");
        sessionStorage.setItem("consent_verified", "1");
        if (!cancelled) setTeamsChecked(true);
        return;
      }

      addLog("info", "No valid cached OBO token — calling bootstrapTeamsMsal, timeout in 10s...");

      const TIMEOUT_MS = 10_000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          const err = new Error("Teams sign-in timed out after 10s. Please try again.");
          err.isTimeout = true;
          reject(err);
        }, TIMEOUT_MS)
      );

      try {
        await Promise.race([bootstrapTeamsMsal(instance, loginRequest), timeoutPromise]);
        addLog("info", "✅ bootstrapTeamsMsal completed successfully");
      } catch (err) {
        const msg = err?.message ?? "Teams authentication failed";

        addLog("error", `Bootstrap failed — step: ${err?.debugInfo?.failedAt ?? (err.isTimeout ? "timeout" : "unknown")}`, {
          message: msg,
          isTimeout: !!err.isTimeout,
          failedAt: err?.debugInfo?.failedAt ?? "unknown",
          debugInfo: err?.debugInfo ?? null,
          sessionStorage: {
            teams_authenticated: sessionStorage.getItem("teams_authenticated"),
            consent_verified: sessionStorage.getItem("consent_verified"),
            teams_obo_token: sessionStorage.getItem("teams_obo_token") ? "[present]" : "[missing]",
            teams_obo_expires_at: sessionStorage.getItem("teams_obo_expires_at"),
          },
          msalAccounts: instance.getAllAccounts().map(a => ({
            username: a.username,
            localAccountId: a.localAccountId,
            tenantId: a.tenantId,
          })),
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
          origin: typeof window !== "undefined" ? window.location.origin : "unknown",
          href: typeof window !== "undefined" ? window.location.href : "unknown",
          time: new Date().toISOString(),
        });

        addLog("warn", "Clearing stale sessionStorage auth flags...");
        sessionStorage.removeItem("teams_authenticated");
        sessionStorage.removeItem("consent_verified");
        sessionStorage.removeItem("teams_obo_token");
        sessionStorage.removeItem("teams_obo_expires_at");
        sessionStorage.removeItem("teams_login_hint");
        addLog("warn", "sessionStorage cleared — ready for clean retry");

        if (!cancelled) {
          setTeamsTimedOut(!!err.isTimeout);
          setDebugInfo(err?.debugInfo ?? {
            error: msg,
            origin: typeof window !== "undefined" ? window.location.origin : "unknown",
            clientId: "6ccf8b01-7af5-497b-9e23-45a92d68a226",
            time: new Date().toISOString(),
          });
          setTeamsAuthError(msg);
        }
      } finally {
        if (!cancelled) setTeamsChecked(true);
      }
    };

    tryTeamsAuth();
    return () => { cancelled = true; };
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

  // ── Consent gate ──────────────────────────────────────────────────────────
  useEffect(() => {
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
    <div className="flex min-h-screen items-center justify-center bg-black">
      {message ? (
        <p className="text-zinc-500 text-sm">{message}</p>
      ) : (
        <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
      )}
    </div>
  );

  // ── Teams auth error screen ────────────────────────────────────────────────
  if (teamsAuthError) {
    const copyLogs = () => {
      const text = logs
        .map(l => `[${l.time}] [${l.level.toUpperCase()}] ${l.msg}${l.data ? "\n" + l.data : ""}`)
        .join("\n");
      navigator.clipboard?.writeText(text).catch(() => {});
    };

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black gap-4 px-6 py-10 text-center max-w-md mx-auto">
        <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <span className="text-red-400 text-lg">!</span>
        </div>

        <div className="space-y-1">
          <p className="text-red-400 text-sm font-medium">
            {teamsTimedOut ? "Sign-in timed out" : "Microsoft Teams sign-in failed"}
          </p>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">
            {teamsTimedOut
              ? "An error occurred, please try again. If this keeps happening, contact your IT administrator."
              : teamsAuthError}
          </p>
        </div>

        {/* ── Developer Console ─────────────────────────── */}
        <div className="w-full text-left">
          <div className="flex items-center justify-between mb-1">
            <p className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
              Developer console
            </p>
            <button
              onClick={copyLogs}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-0.5 rounded border border-zinc-800 hover:border-zinc-700"
            >
              Copy logs
            </button>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1 max-h-72 overflow-y-auto font-mono">
            {logs.length === 0 && (
              <p className="text-zinc-700 text-[10px]">No logs captured.</p>
            )}
            {logs.map((log, i) => (
              <div key={i}>
                <p className={`text-[10px] leading-relaxed break-all ${
                  log.level === "error" ? "text-red-400" :
                  log.level === "warn"  ? "text-amber-400" :
                  "text-zinc-400"
                }`}>
                  <span className="text-zinc-600">{log.time} </span>
                  <span className="text-zinc-500 uppercase">[{log.level}] </span>
                  {log.msg}
                </p>
                {log.data && (
                  <pre className="text-[9px] text-zinc-600 whitespace-pre-wrap break-all pl-2 mt-0.5 border-l border-zinc-800">
                    {log.data}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Checklist — only for non-timeout errors */}
        {!teamsTimedOut && (
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
            ].map((tip, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-zinc-600 text-[10px] mt-0.5">•</span>
                <span className="text-zinc-600 text-[10px] leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        )}

        {/* Full debug JSON */}
        {debugInfo && (
          <details className="w-full text-left">
            <summary className="text-zinc-700 text-[10px] cursor-pointer hover:text-zinc-500 transition-colors">
              Show full debug info (share with your developer)
            </summary>
            <pre className="mt-2 text-left text-[9px] text-zinc-600 bg-zinc-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all border border-zinc-800">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}

        <button
          onClick={() => {
            sessionStorage.removeItem("teams_authenticated");
            sessionStorage.removeItem("consent_verified");
            sessionStorage.removeItem("teams_obo_token");
            sessionStorage.removeItem("teams_obo_expires_at");
            sessionStorage.removeItem("teams_login_hint");
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

  if (!teamsChecked)                                  return loadingScreen(null);
  if (inProgress !== InteractionStatus.None)          return loadingScreen(null);
  if (!isAuthenticated && !teamsAuthenticated)        return loadingScreen("Signing in…");
  if (verified !== true)                              return loadingScreen(null);
  if (requiredRoles?.length > 0 && !hasRequiredRole) return loadingScreen("Checking permissions…");

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