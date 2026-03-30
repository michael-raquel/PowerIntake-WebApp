import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Unauthorized() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Access Denied</title>
      </Head>

      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6">
        {/* Subtle grid background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glow blob — red tint for error state */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[480px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Card */}
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-sm text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Access Denied
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              You don&apos;t have permission to view this page. If you believe
              this is a mistake, please contact your administrator.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/8" />

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/8 px-6 py-3 text-sm font-medium text-white border border-white/10 transition-all hover:bg-white/12 active:scale-[0.98]"
            >
              ← Go Back
            </button>

            <Link
              href="/home"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 px-6 py-3 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white active:scale-[0.98]"
            >
              Go to Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 mt-8 text-xs text-zinc-700">
          Need access?{" "}
          <a
            href="mailto:support@yourorg.com"
            className="text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            Request permissions
          </a>
        </p>
      </div>
    </>
  );
}