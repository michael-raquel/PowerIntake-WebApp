import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { InteractionStatus } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { apiRequest, loginRequest } from "@/lib/msalConfig";

const PENDING_MS_CONSENT_KEY = "pending_ms_consent_query";
const MS_CONSENT_LOGIN_ATTEMPT_KEY = "ms_consent_login_attempted";

export default function MsConsentCallback() {
  const router = useRouter();
  const { instance, accounts, inProgress } = useMsal();
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    console.log(`[MS-CONSENT-CALLBACK] ${msg}`);
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  };

  useEffect(() => {
    addLog(`router.isReady=${router.isReady} | accounts=${accounts?.length ?? 0}`);

    if (!router.isReady) {
      setStatus("Waiting for router...");
      return;
    }

    const { tenant, admin_consent, error: msError } = router.query;

    addLog(`Params — tenant=${tenant} | admin_consent=${admin_consent} | error=${msError ?? "none"}`);

    if (msError) {
      addLog(`Microsoft returned error: ${msError}`);
      setError(`Microsoft error: ${msError}`);
      setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
      return;
    }

    if (!tenant) {
      addLog("Missing tenant parameter in query string");
      setError("Missing tenant parameter.");
      setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
      return;
    }

    if (!accounts?.[0]) {
      setStatus("Waiting for authentication session...");

      if (typeof window !== "undefined") {
        const currentPath = `${window.location.pathname}${window.location.search}`;
        sessionStorage.setItem(PENDING_MS_CONSENT_KEY, currentPath);

        if (inProgress === InteractionStatus.None) {
          const attempted =
            sessionStorage.getItem(MS_CONSENT_LOGIN_ATTEMPT_KEY) === "1";

          if (!attempted) {
            sessionStorage.setItem(MS_CONSENT_LOGIN_ATTEMPT_KEY, "1");
            setStatus("Redirecting to sign-in...");
            addLog("No MSAL account yet — redirecting to sign-in");
            instance.loginRedirect(loginRequest);
            return;
          }
        }
      }

      addLog("No MSAL account yet — will retry when accounts populate");
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(PENDING_MS_CONSENT_KEY);
      sessionStorage.removeItem(MS_CONSENT_LOGIN_ATTEMPT_KEY);
    }

    const run = async () => {
      try {
        setStatus("Acquiring access token...");
        addLog("Calling acquireTokenSilent...");

        const tokenRes = await instance.acquireTokenSilent({
          ...apiRequest,
          account: accounts[0],
        });
        const accessToken = tokenRes?.accessToken ?? null;
        addLog(`Token acquired — scopes: ${tokenRes?.scopes?.join(", ") ?? "unknown"}`);

        setStatus("Sending consent confirmation to server...");
        addLog(`Calling backend consent-callback for tenant=${tenant}`);

        const params = new URLSearchParams();
        params.set("tenant", tenant);
        if (admin_consent) params.set("admin_consent", admin_consent);

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/consent/consent-callback?${params.toString()}`;
        addLog(`POST → ${url}`);

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

        setStatus("Processing server response...");
        const data = await res.json();
        addLog(`Backend response: ${JSON.stringify(data)}`);

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
        setError(`Error: ${err.message}`);
        setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
      }
    };

    run();
  }, [router.isReady, router.query, accounts, instance, inProgress]);

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
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-sm">
          {error ? (
            <>
              <div className="h-10 w-10 rounded-full border-2 border-red-500/30 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
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

          {/* Live debug log panel */}
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
          <p className="text-xs text-zinc-700 tracking-wide">Power Intake · Sparta Services, LLC</p>
        </div>
      </div>
    </>
  );
}