import { useEffect } from "react";
import { useRouter } from "next/router";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { loginRequest } from "@/lib/msalConfig";
import Image from "next/image";

const getUserRole = (account) => {
  const roles = account?.idTokenClaims?.roles || [];

  if (roles.includes("SuperAdmin")) return "super-admin";
  if (roles.includes("SystemAdmin")) return "system-admin";
  if (roles.includes("Manager")) return "manager";
  return "user";
};

export default function Home() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && accounts[0]) {
      // const role = getUserRole(accounts[0]);sesample
      router.push(`/home`);
    }
  }, [isAuthenticated, accounts, router]);

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/powerintakebackground.png')" }}
    >
      {/* Layered overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-slate-950/70 to-violet-950/60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.15)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(15,23,42,0.8)_0%,_transparent_70%)]" />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <Image
            src="/powerintakelogo.png"
            alt="Power Intake"
            width={28}
            height={28}
            className="drop-shadow-lg"
          />
          <span className="text-sm font-semibold tracking-widest text-violet-300/80 uppercase">
            Power Intake
          </span>
        </div>
        <span className="hidden text-xs tracking-[0.2em] text-slate-500 uppercase sm:block">
          Sparta Services, LLC
        </span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex min-h-[calc(100vh-72px)] items-center px-6 pb-10 sm:px-10">
        {isAuthenticated ? (
          <div className="mx-auto text-slate-400 text-sm">Redirecting...</div>
        ) : (
          <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:gap-20 lg:items-center">

            {/* LEFT: Hero content */}
            <section className="flex flex-col">
              {/* Badge */}
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-xs font-medium tracking-widest text-violet-300 uppercase">
                  Sparta Services, LLC
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                <span className="text-white">Power</span>{" "}
                <span className="bg-gradient-to-r from-violet-300 to-violet-500 bg-clip-text text-transparent">
                  Intake
                </span>
              </h1>

              <p className="mt-4 text-base text-slate-400 leading-relaxed max-w-md">
                A universal ticketing tool — intuitive, accountable, and built for everyone.
              </p>

              {/* Feature list */}
              <div className="mt-10 flex flex-col gap-5">
                {[
                  {
                    title: "Improving Accessibility",
                    desc: "Making Power Intake a universal ticketing tool, easy and intuitive for everyone, everywhere!",
                    icon: (
                      <svg className="h-4 w-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Promoting Accountability",
                    desc: "Every ticket matters! Ensuring responsibility and transparency in every step of the ticketing process.",
                    icon: (
                      <svg className="h-4 w-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Exceptional Service",
                    desc: "Going beyond ticketing! Delivering a seamless, efficient, and superior service experience for all.",
                    icon: (
                      <svg className="h-4 w-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    ),
                  },
                ].map(({ title, desc, icon }) => (
                  <div key={title} className="flex gap-3 group">
                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                      {icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-violet-200">{title}</h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* RIGHT: Login card */}
            <section className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm">
                {/* Glow effect behind card */}
                <div className="absolute -inset-4 rounded-3xl bg-violet-600/10 blur-2xl pointer-events-none" />

                <div className="relative w-full rounded-2xl border border-slate-700/50 bg-slate-900/80 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl ring-1 ring-white/5">

                  {/* Card header */}
                  <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 ring-1 ring-violet-500/30 shadow-lg shadow-violet-500/10">
                      <Image
                        src="/powerintakelogo.png"
                        alt="Power Intake logo"
                        width={32}
                        height={32}
                        className="drop-shadow-md"
                      />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Welcome to Power Intake!
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-400">
                      Sign in to continue.
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="mb-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-700/60" />
                    <span className="text-xs text-slate-500 tracking-widest uppercase">Authenticate</span>
                    <div className="h-px flex-1 bg-slate-700/60" />
                  </div>

                  {/* Sign in button */}
                  <button
                    onClick={() => instance.loginRedirect(loginRequest)}
                    className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-md transition-all duration-200 hover:bg-slate-50 hover:shadow-lg hover:shadow-white/10 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    <span className="grid h-5 w-5 grid-cols-2 grid-rows-2 gap-[2px] flex-shrink-0">
                      <span className="rounded-[1px] bg-[#f25022]" />
                      <span className="rounded-[1px] bg-[#7fba00]" />
                      <span className="rounded-[1px] bg-[#00a4ef]" />
                      <span className="rounded-[1px] bg-[#ffb900]" />
                    </span>
                    <span>Sign in with Microsoft</span>
                  </button>

                  {/* Footer note */}
                  <p className="mt-6 text-center text-xs text-slate-600">
                    By signing in, you agree to Sparta Services&apos;{" "}
                    <span className="text-slate-500">terms of use</span>
                  </p>
                </div>

                {/* Bottom badge */}
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  <svg className="h-3 w-3 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-slate-600">Secured by Microsoft Identity</span>
                </div>
              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  );
}