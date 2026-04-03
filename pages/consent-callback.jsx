import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ConsentCallback() {
  const router = useRouter();

  useEffect(() => {
  if (!router.isReady) return;

  const { consent } = router.query;

  const timer = setTimeout(() => {
    if (consent === "success") {
      sessionStorage.setItem("consent_verified", "1");
      window.location.href = "/home";  // ✅ hard navigation, forces full page load
    } else {
      window.location.href = "/no-consent?reason=not-registered";
    }
  }, 2500);

  return () => clearTimeout(timer);
}, [router.isReady, router.query]);

  const { consent } = router.query;
  const isSuccess = consent === "success";
  const isError = consent === "failed";

  return (
    <>
      <Head>
        <title>
          {isSuccess
            ? "Access Granted"
            : isError
              ? "Consent Failed"
              : "Processing..."}{" "}
          — Power Intake
        </title>
      </Head>

      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6">
        {/* Grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* Glow — green for success, red for error, violet for loading */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full"
          style={{
            background: isSuccess
              ? "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)"
              : isError
                ? "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Card */}
        <div className="relative z-10 w-full max-w-[380px] rounded-2xl border border-white/[0.07] bg-white/[0.025] p-8 shadow-2xl backdrop-blur-sm space-y-5 text-center">
          {/* Icon */}
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${
              isSuccess
                ? "border-green-500/20 bg-green-500/5"
                : isError
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-violet-500/20 bg-violet-500/5"
            }`}
          >
            {isSuccess ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : isError ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-red-400"
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
            ) : (
              <div className="h-6 w-6 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            )}
          </div>

          {/* Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase border ${
              isSuccess
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : isError
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-violet-500/10 border-violet-500/20 text-violet-400"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {isSuccess ? "Approved" : isError ? "Failed" : "Processing"}
          </span>

          <div className="space-y-2">
            <h1 className="text-[17px] font-semibold tracking-tight text-white leading-snug">
              {isSuccess
                ? "Access Granted"
                : isError
                  ? "Consent Failed"
                  : "Processing consent..."}
            </h1>
            <p className="text-sm leading-relaxed text-zinc-500">
              {isSuccess
                ? "Your organization has been approved. Redirecting you to Power Intake now."
                : isError
                  ? "Something went wrong during the consent process. Please contact Sparta Services for assistance."
                  : "Please wait while we verify your organization's permissions."}
            </p>
          </div>

          {/* Progress bar for success/loading states */}
          {!isError && (
            <>
              <div className="border-t border-white/[0.06]" />
              <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isSuccess ? "bg-green-500" : "bg-violet-500"
                  } ${!isError ? "animate-[progress_2.5s_ease-in-out_forwards]" : ""}`}
                  style={{ width: isSuccess ? "100%" : "60%" }}
                />
              </div>
            </>
          )}

          {/* Error action */}
          {isError && (
            <>
              <div className="border-t border-white/[0.06]" />

              <a
                href="mailto:support@spartaserv.com"
                className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-white/[0.06] transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                Contact support@spartaserv.com
              </a>
            </>
          )}
        </div>

        {/* Footer branding */}
        <div className="relative z-10 mt-5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 opacity-60" />
          <p className="text-xs text-zinc-700 tracking-wide">
            Power Intake · Sparta Services, LLC
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
