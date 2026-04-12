import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Unauthorized() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Access Denied — Power Intake</title>
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

        {/* Glow blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Card */}
        <div className="relative z-10 w-full max-w-[380px] rounded-2xl border border-white/[0.07] bg-white/[0.025] p-8 shadow-2xl backdrop-blur-sm text-center space-y-5">
          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase border bg-red-500/10 border-red-500/20 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            Access Denied
          </span>

          <div className="space-y-2">
            <h1 className="text-[17px] font-semibold tracking-tight text-white leading-snug">
              You don&apos;t have permission
            </h1>
            <p className="text-sm leading-relaxed text-zinc-500">
              You don&apos;t have permission to view this page. If you believe
              this is a mistake, please contact your administrator.
            </p>
          </div>

          <div className="border-t border-white/[0.06]" />

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-white/[0.06] transition-all active:scale-[0.98]"
            >
              ← Go Back
            </button>
            <Link
              href="/home"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-white/[0.06] transition-all active:scale-[0.98]"
            >
              Go to Home
            </Link>
          </div>
        </div>

        {/* Footer branding */}
        <div className="relative z-10 mt-5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 opacity-60" />
          <p className="text-xs text-zinc-700 tracking-wide">
            Power Intake · Sparta Services, LLC
          </p>
        </div>
      </div>
    </>
  );
}