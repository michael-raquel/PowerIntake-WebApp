import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";

// After a successful consent+provisioning cycle the admin's JWT does not yet
// carry the new app roles (PowerIntake.Admin / PowerIntake.Users). A fresh
// loginRedirect forces MSAL to issue a new token with the correct claims, and
// also clears the stale account state that was causing the "choose account"
// prompt on the ms-consent-callback page.

export default function ConsentCallback() {
  const router = useRouter();
  const { instance } = useMsal();
  const [status, setStatus] = useState("Finalizing...");

  useEffect(() => {
    if (!router.isReady) return;

    const { consent } = router.query;

    if (consent === "success") {
      setStatus("Setup complete. Signing you in with updated permissions...");

      // Small delay so the status message is visible before the redirect fires
      setTimeout(() => {
        instance.loginRedirect({
          ...apiRequest,
          // land back on /checking which will re-verify consent status
          redirectUri: `${window.location.origin}/checking`,
          prompt: "select_account",
        });
      }, 1500);

      return;
    }

    if (consent === "failed") {
      setStatus("Something went wrong during setup.");
      setTimeout(() => router.replace("/no-consent?reason=consent-update-failed"), 3000);
      return;
    }

    // Fallback — unexpected query state
    router.replace("/");
  }, [router.isReady, router.query, instance, router]);

  const isFailed = router.query?.consent === "failed";

  return (
    <>
      <Head>
        <title>Finalizing Setup — Power Intake</title>
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

        <div className="relative z-10 flex flex-col items-center gap-5">
          {isFailed ? (
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
          ) : (
            <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
          )}
          <p className={`text-sm ${isFailed ? "text-red-400" : "text-zinc-400"}`}>{status}</p>
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