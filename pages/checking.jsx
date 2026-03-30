import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/msalConfig";

export default function Checking() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const { isGlobalAdmin } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState("Verifying your access...");

  useEffect(() => {
    if (!isAuthenticated || !accounts?.[0]) return;

    const check = async () => {
      try {
        // ── 1. Get API token ─────────────────────────────
        const tokenRes = await instance.acquireTokenSilent({
          ...apiRequest,
          account: accounts[0],
        });

        // ── 2. Call backend consent-status ───────────────
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/consent/consent-status`,
          {
            headers: {
              Authorization: `Bearer ${tokenRes.accessToken}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Consent status request failed");
        }

        const data = await res.json();

        const claims = JSON.parse(atob(tokenRes.accessToken.split(".")[1]));
        const tid = claims?.tid;

        console.log("[CHECKING]", data);

        // ── 3. Tenant exists + consented → proceed ───────
        if (data.tenantExists && data.consented) {
          setStatus("Access granted. Redirecting...");
          sessionStorage.setItem("consent_verified", "1"); // ✅ here only
          router.replace("/home");
          return;
        }

        // ── 4. Tenant NOT registered ─────────────────────
        if (!data.tenantExists) {
          setStatus("Your organization is not registered...");
          router.replace("/no-consent?reason=not-registered");
          return;
        }

        // ── 5. Tenant exists but NOT consented ───────────
        if (data.tenantExists && !data.consented) {
          if (isGlobalAdmin) {
            setStatus("Redirecting to Microsoft for approval...");

            const consentUrl = [
              `https://login.microsoftonline.com/${tid}/adminconsent`,
              `?client_id=${process.env.NEXT_PUBLIC_AZURE_CLIENT_ID}`,
              `&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/consent-callback`,
            ].join("");

            window.location.href = consentUrl;
          } else {
            setStatus("Waiting for administrator approval...");
            router.replace("/no-consent?reason=needs-admin-login");
          }

          return;
        }

      } catch (err) {
        console.error("[CHECKING ERROR]", err.message);

        // 🔥 DO NOT fail open anymore
        setStatus("Something went wrong. Redirecting...");
        router.replace("/no-consent?reason=error");
      }
    };

    check();
  }, [isAuthenticated, accounts, instance, router, isGlobalAdmin]);

  return (
    <>
      <Head>
        <title>Checking Access — Power Intake</title>
      </Head>

      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6">
        {/* Grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
          <p className="text-sm text-zinc-500">{status}</p>
        </div>

        {/* Footer */}
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