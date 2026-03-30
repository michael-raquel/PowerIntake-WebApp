import Head from "next/head";
import { useRouter } from "next/router";
import { useMsal } from "@azure/msal-react";

const SUPPORT_EMAIL = "support@spartaserv.com";
const SUPPORT_PHONE = "+1 (800) 123-4567";

// ─────────────────────────────────────────────────────────────
// SCENARIOS
// ─────────────────────────────────────────────────────────────
const SCENARIOS = {
  // 1️⃣ Tenant not onboarded
  "not-registered": {
    glow: "rgba(239,68,68,0.09)",
    iconColor: "text-red-400",
    iconBg: "border-red-500/20 bg-red-500/5",
    badge: { color: "bg-red-500/10 border-red-500/20 text-red-400", label: "Not Registered" },
    title: "Your Company Isn't Registered",
    body: "Your organization hasn't been set up in the Power Intake system yet. Please contact Sparta Services to get onboarded.",
    actions: "contact",
  },

  // 2️⃣ Needs admin consent (non-admin user)
  "needs-admin-login": {
    glow: "rgba(245,158,11,0.09)",
    iconColor: "text-amber-400",
    iconBg: "border-amber-500/20 bg-amber-500/5",
    badge: { color: "bg-amber-500/10 border-amber-500/20 text-amber-400", label: "Admin Approval Required" },
    title: "Admin Approval Required",
    body: "Your organization is registered, but an Azure AD Global Administrator must approve permissions before you can continue.",
    actions: "info",
    footer: "Ask your IT admin to sign in and approve access.",
  },

  // 3️⃣ Generic system error
  "error": {
    glow: "rgba(239,68,68,0.09)",
    iconColor: "text-red-400",
    iconBg: "border-red-500/20 bg-red-500/5",
    badge: { color: "bg-red-500/10 border-red-500/20 text-red-400", label: "Error" },
    title: "Something Went Wrong",
    body: "We couldn't complete the request. Please try again or contact support if the issue persists.",
    actions: "retry-contact",
  },

  // 4️⃣ Consent callback succeeded but DB update failed
  "consent-update-failed": {
    glow: "rgba(249,115,22,0.09)",
    iconColor: "text-orange-400",
    iconBg: "border-orange-500/20 bg-orange-500/5",
    badge: { color: "bg-orange-500/10 border-orange-500/20 text-orange-400", label: "Sync Failed" },
    title: "Consent Completed, But Setup Failed",
    body: "Admin consent was granted, but we couldn’t finalize your setup. Please retry or contact support.",
    actions: "retry-contact",
  },
};

const DEFAULT_SCENARIO = SCENARIOS["error"];

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
function ContactRow({ icon, label, value, href }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
    >
      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-zinc-600 uppercase">{label}</p>
        <p className="text-sm text-zinc-300">{value}</p>
      </div>
    </a>
  );
}

export default function NoConsent() {
  const { instance } = useMsal();
  const router = useRouter();
  const { reason } = router.query;

  const scenario = SCENARIOS[reason] ?? DEFAULT_SCENARIO;

  const logout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: "/" });
  };

  const retry = () => {
    router.replace("/checking");
  };

  return (
    <>
      <Head>
        <title>Access Issue — Power Intake</title>
      </Head>

      <div className="flex min-h-screen items-center justify-center bg-black px-6">
        <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-white/5 space-y-5">

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-lg text-white font-semibold">
              {scenario.title}
            </h1>
            <p className="text-sm text-zinc-400">
              {scenario.body}
            </p>
          </div>

          <div className="border-t border-white/10" />

          {/* CONTACT */}
          {scenario.actions === "contact" && (
            <div className="space-y-2">
              <ContactRow
                href={`mailto:${SUPPORT_EMAIL}`}
                label="Email"
                value={SUPPORT_EMAIL}
                icon={<span>📧</span>}
              />
              <ContactRow
                href={`tel:${SUPPORT_PHONE}`}
                label="Phone"
                value={SUPPORT_PHONE}
                icon={<span>📞</span>}
              />
            </div>
          )}

          {/* INFO */}
          {scenario.actions === "info" && (
            <p className="text-xs text-amber-400 text-center">
              {scenario.footer}
            </p>
          )}

          {/* RETRY + CONTACT */}
          {scenario.actions === "retry-contact" && (
            <div className="flex flex-col gap-3">
              <button
                onClick={retry}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl"
              >
                Retry
              </button>

              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-center text-sm text-zinc-400 hover:text-white"
              >
                Contact Support
              </a>
            </div>
          )}

          <div className="border-t border-white/10" />

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full text-sm text-zinc-500 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}