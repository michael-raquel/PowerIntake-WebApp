import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function MsConsentCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing consent...");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    const { tenant, admin_consent, error: msError } = router.query;

    console.log("[MS-CONSENT-CALLBACK] Params received:", { tenant, admin_consent, error: msError });

    const process = async () => {
      try {
        // ── Guard: if Microsoft returned an error ──────
        if (msError) {
          console.error("[MS-CONSENT-CALLBACK] Microsoft returned error:", msError);
          setError(`Microsoft error: ${msError}`);
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
          return;
        }

        if (!tenant) {
          console.error("[MS-CONSENT-CALLBACK] No tenant param received");
          setError("Missing tenant parameter.");
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
          return;
        }

        setStatus("Confirming with server...");

        const params = new URLSearchParams();
        params.set("tenant", tenant);
        if (admin_consent) params.set("admin_consent", admin_consent);

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/consent/consent-callback?${params.toString()}`;
        console.log("[MS-CONSENT-CALLBACK] Fetching:", url);

        const res = await fetch(url);

        console.log("[MS-CONSENT-CALLBACK] Response status:", res.status);

        if (!res.ok) {
          const text = await res.text();
          console.error("[MS-CONSENT-CALLBACK] Backend error body:", text);
          setError(`Server error: ${res.status}`);
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
          return;
        }

        const data = await res.json();
        console.log("[MS-CONSENT-CALLBACK] Backend response:", data);

        if (data?.redirectUrl) {
          router.replace(data.redirectUrl);
        } else {
          console.error("[MS-CONSENT-CALLBACK] No redirectUrl in response:", data);
          setError("Unexpected server response.");
          setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
        }
      } catch (err) {
        console.error("[MS-CONSENT-CALLBACK] Fetch failed:", err.message);
        setError(`Network error: ${err.message}`);
        setTimeout(() => router.replace("/consent-callback?consent=failed"), 3000);
      }
    };

    process();
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
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col items-center gap-5">
          {error ? (
            // ── Error state ──────────────────────────────
            <>
              <div className="h-10 w-10 rounded-full border-2 border-red-500/30 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm text-red-400">{error}</p>
              <p className="text-xs text-zinc-600">Redirecting...</p>
            </>
          ) : (
            // ── Loading state ────────────────────────────
            <>
              <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
              <p className="text-sm text-zinc-500">{status}</p>
            </>
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