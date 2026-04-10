import Head from "next/head";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

const CONSENT_STORAGE_KEY = "ms_consent_params";

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
  const { instance } = useMsal();
  const [status, setStatus] = useState("Processing consent...");
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((msg) => {
    console.log(`[MS-CONSENT-CALLBACK] ${msg}`);
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  }, []);

  useEffect(() => {
    // Guard: wait for Next.js router to be ready before reading query params
    if (!router.isReady) return;

    const run = async () => {
      try {
        // ── Step 1: Handle MSAL redirect response ──────────────────────────
        // This MUST run first. After Microsoft redirects back here,
        // MSAL needs to process the URL hash/query to restore the account
        // into its cache. Without this, accounts[] stays empty and we'd
        // incorrectly trigger a second loginRedirect (the account picker loop).
        addLog("Calling handleRedirectPromise to process MSAL redirect...");
        setStatus("Completing sign-in...");
        const redirectResult = await instance.handleRedirectPromise();

        if (redirectResult) {
          addLog(`handleRedirectPromise resolved — account: ${redirectResult.account?.username ?? "unknown"}`);
        } else {
          addLog("handleRedirectPromise resolved with null (no pending redirect)");
        }

        // ── Step 2: Resolve the active account ────────────────────────────
        // After handleRedirectPromise, the account is in the MSAL cache.
        // Prefer the account from the redirect result, fall back to cache.
        const allAccounts = instance.getAllAccounts();
        const account = redirectResult?.account ?? allAccounts[0] ?? null;

        addLog(`Resolved account: ${account?.username ?? "NONE"} | total cached: ${allAccounts.length}`);

        if (!account) {
          // No account even after handling the redirect — this is a genuine
          // auth failure, not a timing issue. Do not loginRedirect here;
          // that would restart the loop. Surface the error instead.
          addLog("No account resolved after handleRedirectPromise — aborting");
          setError("Sign-in could not be completed. Please return to the app and try again.");
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
          return;
        }

        // Set it as active so acquireTokenSilent picks it up
        instance.setActiveAccount(account);

        // ── Step 3: Read consent params from URL or sessionStorage ────────
        const {
          tenant: queryTenant,
          admin_consent: queryAdminConsent,
          error: msError,
        } = router.query;

        const stored = readStoredConsent();
        const tenant = normalizeParam(queryTenant) ?? stored?.tenant ?? null;
        const adminConsent = normalizeParam(queryAdminConsent) ?? stored?.admin_consent ?? null;

        // Persist in case of any further redirects (defensive)
        writeStoredConsent({ tenant, admin_consent: adminConsent });

        addLog(`Params — tenant=${tenant ?? "none"} | admin_consent=${adminConsent ?? "none"} | error=${msError ?? "none"}`);

        // ── Step 4: Guard — Microsoft-returned error ───────────────────────
        if (msError) {
          addLog(`Microsoft returned error: ${msError}`);
          setError(`Microsoft error: ${msError}`);
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
          return;
        }

        // ── Step 5: Guard — missing tenant param ──────────────────────────
        if (!tenant) {
          addLog("Missing tenant parameter — cannot proceed");
          setError("Missing tenant parameter.");
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
          return;
        }

        // ── Step 6: Acquire token silently ────────────────────────────────
        setStatus("Acquiring access token...");
        addLog("Calling acquireTokenSilent...");

        const tokenRes = await instance.acquireTokenSilent({
          ...apiRequest,
          account,
        });

        const accessToken = tokenRes?.accessToken ?? null;
        addLog(`Token acquired — scopes: ${tokenRes?.scopes?.join(", ") ?? "unknown"}`);

        // ── Step 7: Call backend consent-callback ─────────────────────────
        setStatus("Sending consent confirmation to server...");
        addLog(`Calling backend consent-callback for tenant=${tenant}`);

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

        addLog(`Backend responded with HTTP ${res.status}`);

        if (!res.ok) {
          const text = await res.text();
          addLog(`Backend error body: ${text}`);
          setError(`Server error: ${res.status} — ${text}`);
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
          return;
        }

        // ── Step 8: Follow backend redirect instruction ───────────────────
        setStatus("Processing server response...");
        const data = await res.json();
        addLog(`Backend response: ${JSON.stringify(data)}`);

        // Clean up stored consent params — no longer needed
        sessionStorage.removeItem(CONSENT_STORAGE_KEY);

        if (data?.redirectUrl) {
          addLog(`Redirecting to: ${data.redirectUrl}`);
          setStatus("Redirecting...");
          router.replace(data.redirectUrl);
        } else {
          addLog("No redirectUrl in response — unexpected payload");
          setError("Unexpected server response.");
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
        }

      } catch (err) {
        addLog(`Exception caught: ${err.message}`);

        // acquireTokenSilent can throw InteractionRequiredAuthError if the
        // token cache is cold. In that scenario the consent was still granted
        // — the provisioning flow just can't run without a token. Redirect to
        // failed so the user sees a clear message rather than a blank spinner.
        setError(`Error: ${err.message}`);
        setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
      }
    };

    run();
  // router.query changes when Next hydrates the URL — intentionally included
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query]);

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