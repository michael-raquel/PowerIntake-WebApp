import Head from "next/head";
import { useRouter } from "next/router";
import { useMsal } from "@azure/msal-react";
import { useEffect } from "react";

const SUPPORT_EMAIL = "support@spartaserv.com";
const SUPPORT_PHONES = [
  { label: "Telephone", value: "+1 877-655-3469" },
  { label: "Local number", value: "+1 425-655-3468" },
];

// ─────────────────────────────────────────────────────────────
// SCENARIOS
// ─────────────────────────────────────────────────────────────
const SCENARIOS = {
  // 1️⃣ Tenant not onboarded
  "not-registered": {
    title: "Your Company Isn't Registered",
    body: "Your organization hasn't been set up in the Power Intake system yet. Please contact Sparta Services to get onboarded.",
    actions: "contact",
  },

  // 2️⃣ Needs admin consent (non-admin user)
  "needs-admin-login": {
    title: "Admin Approval Required",
    body: "Your organization is registered, but an Azure AD Global Administrator must approve permissions before you can continue.",
    actions: "info",
    footer: "Ask your IT admin to sign in and approve access.",
  },

  // 3️⃣ Generic system error
  error: {
    title: "Something Went Wrong",
    body: "We couldn't complete the request. Please try again or contact support if the issue persists.",
    actions: "retry-contact",
  },

  // 4️⃣ Deactivated org
  deactivated: {
    title: "Your Organization Has Been Deactivated",
    body: "Access to Power Intake has been suspended for your organization. Please contact Sparta Services to restore your account.",
    actions: "contact",
  },

  // 5️⃣ Consent callback succeeded but DB update failed
  "consent-update-failed": {
    title: "Consent Completed, But Setup Failed",
    body: "Admin consent was granted, but we couldn't finalize your setup. Please retry or contact support.",
    actions: "retry-contact",
  },
  "pending-approval": {
  title: "Awaiting Approval",
  body: "Your organization has been registered and is pending approval from Sparta Services.",
  actions: "contact",
},
};

const DEFAULT_SCENARIO = SCENARIOS["error"];

// ─────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────
function PhoneIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(167,139,250,1)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.72A2 2 0 012 .94h3a2 2 0 012 1.72c.12.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L6.09 8.74a16 16 0 006.17 6.17l1.16-1.16a2 2 0 012.11-.45c.9.35 1.85.59 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="2"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="2"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l2 2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(167,139,250,1)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// PHONE ROW
// ─────────────────────────────────────────────────────────────
function PhoneRow({ label, value }) {
  const href = `tel:${value.replace(/[^+\d]/g, "")}`;
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3.5 py-3 no-underline border-b border-white/[0.07] last:border-b-0 hover:bg-white/[0.04] transition-colors"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-violet-500/15 border border-violet-500/25">
        <PhoneIcon />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-white/30 uppercase tracking-wide m-0 mb-0.5">
          {label}
        </p>
        <p className="text-sm text-white/85 m-0">{value}</p>
      </div>
      <ChevronIcon />
    </a>
  );
}

// ─────────────────────────────────────────────────────────────
// SUPPORT BLOCK — used for "contact" and "retry-contact"
// ─────────────────────────────────────────────────────────────
function SupportBlock() {
  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div>
        <p className="text-[10px] font-medium text-white/35 uppercase tracking-widest mb-1">
          Contact support
        </p>
        <p className="text-sm text-white/50 m-0">
          Speak directly with our MSP experts.
        </p>
      </div>

      {/* Phone rows */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        {SUPPORT_PHONES.map((phone) => (
          <PhoneRow key={phone.value} label={phone.label} value={phone.value} />
        ))}
      </div>

      {/* Hours */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <ClockIcon />
        <div>
          <p className="text-xs text-white/45 m-0 leading-relaxed">
            Mon–Fri, 5AM–5PM PST
          </p>
          <p className="text-xs text-white/30 m-0 leading-relaxed">
            Available 24/7 after regular business hours.
          </p>
        </div>
      </div>

      {/* Email */}
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors no-underline"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-violet-500/15 border border-violet-500/25">
          <MailIcon />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-white/30 uppercase tracking-wide m-0 mb-0.5">
            Email
          </p>
          <p className="text-sm text-white/85 m-0">{SUPPORT_EMAIL}</p>
        </div>
        <ChevronIcon />
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function NoConsent() {
  const { instance } = useMsal();
  const router = useRouter();
  const { reason } = router.query;

  const scenario = SCENARIOS[reason] ?? DEFAULT_SCENARIO;

  useEffect(() => {
    instance.setActiveAccount(null);

    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("msal.")) sessionStorage.removeItem(key);
    });

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("msal.")) localStorage.removeItem(key);
    });
  }, [instance]);

  const goToRoot = () => router.push("/");

  return (
    <>
      <Head>
        <title>Access Issue — Power Intake</title>
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
            background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Card */}
        <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-white/[0.07] bg-white/[0.025] p-8 shadow-2xl backdrop-blur-sm space-y-5">
          {/* Title + body */}
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase border bg-violet-500/10 border-violet-500/20 text-violet-400">
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              Power Intake
            </span>
            <h1 className="text-[17px] font-semibold tracking-tight text-white leading-snug">
              {scenario.title}
            </h1>
            <p className="text-sm leading-relaxed text-zinc-500">{scenario.body}</p>
          </div>

          <div className="border-t border-white/[0.06]" />

          {/* ── CONTACT ─────────────────────────────────── */}
          {scenario.actions === "contact" && <SupportBlock />}

          {/* ── INFO (admin consent needed) ──────────────── */}
          {scenario.actions === "info" && (
            <p className="text-xs text-amber-400 text-center">
              {scenario.footer}
            </p>
          )}

          {/* ── CONTACT (error scenarios) ─────────────────── */}
          {scenario.actions === "retry-contact" && (
            <SupportBlock />
          )}

          <div className="border-t border-white/[0.06]" />

          {/* Go back to root */}
          <button
            onClick={goToRoot}
            className="w-full text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Back to home
          </button>
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
