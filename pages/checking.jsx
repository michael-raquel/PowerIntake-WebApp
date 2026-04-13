import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/msalConfig";

export default function Checking() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const { isGlobalAdmin, isGlobalAdminLoading } = useAuth(); // ← add isGlobalAdminLoading
  const router = useRouter();

  const [status, setStatus] = useState("Verifying your access...");

  useEffect(() => {
    // Wait until we know whether this user is a Global Admin or not.
    // Without this guard, check() fires while isGlobalAdmin=false (still loading),
    // the backend 403s for a new Global Admin tenant, and we wrongly show not-registered.
    if (!isAuthenticated || !accounts?.[0] || isGlobalAdminLoading) return;

    const check = async () => {
      try {
        const tokenRes = await instance.acquireTokenSilent({
          ...apiRequest,
          account: accounts[0],
        });

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/consent/consent-status`,
          { headers: { Authorization: `Bearer ${tokenRes.accessToken}` } },
        );

        if (res.status === 403) {
          // Backend blocked because user is not a Global Admin and tenant doesn't exist.
          // isGlobalAdminLoading is false here so isGlobalAdmin is settled — safe to read.
          router.replace("/no-consent?reason=not-registered");
          return;
        }

        if (!res.ok) throw new Error("Consent status request failed");

        const data = await res.json();
        const claims = JSON.parse(atob(tokenRes.accessToken.split(".")[1]));
        const tid = claims?.tid;
        const consented  = data?.consented === true;
        const isactive   = data?.isactive === true;
        const isapproved = data?.isapproved === true;

        if (!isapproved) {
          setStatus("Awaiting Sparta Services approval...");
          router.replace("/no-consent?reason=pending-approval");
          return;
        }

        if (consented && !isactive) {
          setStatus("Your organization has been deactivated...");
          router.replace("/no-consent?reason=deactivated");
          return;
        }

        if (consented) {
          setStatus("Access granted. Redirecting...");
          sessionStorage.setItem("consent_verified", "1");
          router.replace("/home");
          return;
        }

        if (!consented) {
          if (isGlobalAdmin) {
            setStatus("Redirecting to Microsoft for approval...");

            sessionStorage.setItem(
              "pre_consent_account",
              JSON.stringify({
                homeAccountId: accounts[0].homeAccountId,
                tenantId: tid,
              }),
            );

            const consentUrl = [
              `https://login.microsoftonline.com/${tid}/adminconsent`,
              `?client_id=${process.env.NEXT_PUBLIC_AZURE_CLIENT_ID}`,
              `&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/ms-consent-callback`,
              `&prompt=consent`,
            ].join("");

            window.location.href = consentUrl;
          }
          return;
        }
      } catch (err) {
        console.error("[CHECKING ERROR]", err.message);
        setStatus("Something went wrong. Redirecting...");
        router.replace("/no-consent?reason=error");
      }
    };

    check();
  }, [isAuthenticated, accounts, instance, router, isGlobalAdmin, isGlobalAdminLoading]);
  return (
    <>
      <Head>
        <title>Checking Access — Power Intake</title>
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
            background:
              "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
          <p className="text-sm text-zinc-500">{status}</p>
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
