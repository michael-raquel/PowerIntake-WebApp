import Head from "next/head";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { apiRequest } from "@/lib/msalConfig";

const CONSENT_STORAGE_KEY = "ms_consent_params";
const MSAL_ACCOUNT_KEY    = "msal_consent_account";

const readStoredConsent = () => {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(CONSENT_STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const writeStoredConsent = (params) => {
  if (typeof window === "undefined") return;
  if (!params?.tenant && !params?.admin_consent) return;
  sessionStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(params));
};

const normalizeParam = (value) => (Array.isArray(value) ? value[0] : value);

export default function MsConsentCallback() {
  const router = useRouter();
  const { instance, inProgress } = useMsal();
  const [status, setStatus] = useState("Processing consent...");
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const hasRun = useRef(false);

  const addLog = useCallback((msg) => {
    console.log(`[MS-CONSENT-CALLBACK] ${msg}`);
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (inProgress !== InteractionStatus.None) {
      addLog(`Waiting for MSAL — inProgress=${inProgress}`);
      return;
    }
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      try {
        setStatus("Completing sign-in...");

        // ── Step 1: Resolve account ──────────────────────────────────────────
        // handleRedirectPromise() will return null here because MsalProvider
        // already consumed the redirect result during its own initialization
        // in _app.jsx. Instead we rely on two fallback sources:
        //   1. The account stored by our _app.jsx event callback (most reliable)
        //   2. MSAL's own account cache (getAllAccounts)
        let account = null;

        // Source 1 — account stored by checking.jsx before the adminconsent redirect
        // (LOGIN_SUCCESS never fires for adminconsent — it's not an MSAL login flow)
        let storedMeta = null;
        const storedAccountRaw = sessionStorage.getItem(MSAL_ACCOUNT_KEY);
        if (storedAccountRaw) {
          try {
            storedMeta = JSON.parse(storedAccountRaw);
            const allAccounts = instance.getAllAccounts();
            account = allAccounts.find(
              (a) => a.homeAccountId === storedMeta.homeAccountId,
            ) ?? null;
            addLog(`Source 1 (stored meta) — cache lookup: ${account?.username ?? "not in cache"}`);
          } catch {
            addLog("Source 1 — failed to parse stored account meta");
          }
        } else {
          addLog("Source 1 — no stored account meta found");
        }

        // Source 2 — fall back to whatever is in the MSAL cache
        if (!account) {
          const allAccounts = instance.getAllAccounts();
          account = allAccounts[0] ?? null;
          addLog(`Source 2 (cache fallback) — resolved: ${account?.username ?? "NONE"} | cached: ${allAccounts.length}`);
        }

        // Source 3 — reconstruct a minimal account from stored meta so
        // acquireTokenSilent can still be attempted even if the MSAL cache
        // was cleared by the adminconsent browser redirect
        if (!account && storedMeta?.homeAccountId) {
          account = {
            homeAccountId:  storedMeta.homeAccountId,
            localAccountId: storedMeta.localAccountId,
            username:       storedMeta.username,
            tenantId:       storedMeta.tenantId,
            environment:    "login.microsoftonline.com",
          };
          addLog(`Source 3 (reconstructed from meta) — username: ${account.username}`);
        }

        if (!account) {
          addLog("No account resolved from any source — cannot proceed");
          setError("Sign-in could not be completed. Please return to the app and try again.");
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
          return;
        }

        instance.setActiveAccount(account);
        addLog(`Active account set — ${account.username}`);

        // Clean up the stored account meta — no longer needed
        sessionStorage.removeItem(MSAL_ACCOUNT_KEY);

        // ── Step 2: Read consent params ──────────────────────────────────────
        const {
          tenant: queryTenant,
          admin_consent: queryAdminConsent,
          error: msError,
        } = router.query;

        const stored = readStoredConsent();
        const tenant       = normalizeParam(queryTenant)       ?? stored?.tenant        ?? null;
        const adminConsent = normalizeParam(queryAdminConsent) ?? stored?.admin_consent ?? null;

        writeStoredConsent({ tenant, admin_consent: adminConsent });

        addLog(`Params — tenant=${tenant ?? "none"} | admin_consent=${adminConsent ?? "none"} | msError=${msError ?? "none"}`);

        // ── Step 3: Guard — Microsoft error ─────────────────────────────────
        if (msError) {
          addLog(`Microsoft returned error: ${msError}`);
          setError(`Microsoft error: ${msError}`);
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
          return;
        }

        // ── Step 4: Guard — missing tenant ──────────────────────────────────
        if (!tenant) {
          addLog("Missing tenant parameter");
          setError("Missing tenant parameter. Please try the consent process again.");
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
          return;
        }

        // ── Step 5: Acquire token silently ──────────────────────────────────
        setStatus("Acquiring access token...");
        addLog("Calling acquireTokenSilent...");

        let accessToken = null;
        try {
          const tokenRes = await instance.acquireTokenSilent({
            ...apiRequest,
            account,
          });
          accessToken = tokenRes?.accessToken ?? null;
          addLog(`Token acquired — scopes: ${tokenRes?.scopes?.join(", ") ?? "unknown"}`);
        } catch (tokenErr) {
          addLog(`acquireTokenSilent failed (non-fatal): ${tokenErr.message}`);
        }

        // ── Step 6: Call backend ─────────────────────────────────────────────
        setStatus("Sending consent to server...");

        const params = new URLSearchParams();
        params.set("tenant", tenant);
        if (adminConsent) params.set("admin_consent", adminConsent);

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/consent/consent-callback?${params.toString()}`;
        addLog(`GET → ${url}`);

        const res = await fetch(url, {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        addLog(`Backend — HTTP ${res.status}`);

        if (!res.ok) {
          const text = await res.text();
          addLog(`Backend error: ${text}`);
          setError(`Server error ${res.status}: ${text}`);
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
          return;
        }

        // ── Step 7: Follow redirect ──────────────────────────────────────────
        setStatus("Finalizing...");
        const data = await res.json();
        addLog(`Backend response: ${JSON.stringify(data)}`);

        sessionStorage.removeItem(CONSENT_STORAGE_KEY);

        if (data?.redirectUrl) {
          addLog(`Redirecting → ${data.redirectUrl}`);
          setStatus("Redirecting...");
          router.replace(data.redirectUrl);
        } else {
          addLog("No redirectUrl in response");
          setError("Unexpected server response.");
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
        }

      } catch (err) {
        addLog(`Unhandled exception: ${err.message}`);
        setError(`Error: ${err.message}`);
        setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
      }
    };

    run();
  }, [router.isReady, router.query, inProgress]);

  return (
    <>
      <Head>
        <title>Processing Consent — Power Intake</title>
      </Head>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-sm">
          {error ? (
            <>
              <div className="h-10 w-10 rounded-full border-2 border-red-500/30 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <p className="text-sm text-red-400 text-center">{error}</p>
              <p className="text-xs text-zinc-600">Redirecting...</p>
            </>
          ) : (
            <>
              <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
              <p className="text-sm text-zinc-400">{status}</p>
            </>
          )}

          {logs.length > 0 && (
            <div className="w-full mt-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 space-y-1 max-h-48 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 text-[10px] font-mono leading-relaxed">
                  <span className="text-zinc-600 shrink-0">{log.time}</span>
                  <span className="text-zinc-400">{log.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 mt-10 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 opacity-60" />
          <p className="text-xs text-zinc-700 tracking-wide">
            Power Intake · Sparta Services, LLC
          </p>
        </div>
      </div>
    </>
  );
}