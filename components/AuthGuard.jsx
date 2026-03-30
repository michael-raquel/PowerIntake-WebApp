import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { loginRequest } from "@/lib/msalConfig";

export default function AuthGuard({ children, requiredRoles }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const router = useRouter();

  // null = unknown, true = verified, false = not verified
  const [verified, setVerified] = useState(null);

  // ── Auth redirect ───────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      instance.loginRedirect(loginRequest);
    }
  }, [isAuthenticated, instance]);

  // ── Consent gate ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const isVerified = sessionStorage.getItem("consent_verified") === "1";

    if (isVerified) {
      setVerified(true);
    } else {
      // Not verified yet — send to /checking before rendering anything
      router.replace("/checking");
      // Keep verified=null so children never flash
    }
  }, [isAuthenticated, router]);

  // ── Role check ──────────────────────────────────────────
  const hasRequiredRole = useMemo(() => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    const roles = (accounts[0]?.idTokenClaims?.roles ?? []).map(String);
    return requiredRoles.some((role) => roles.includes(role));
  }, [accounts, requiredRoles]);

  useEffect(() => {
    if (isAuthenticated && verified && requiredRoles?.length > 0 && !hasRequiredRole) {
      router.replace("/unauthorized");
    }
  }, [isAuthenticated, verified, requiredRoles, hasRequiredRole, router]);

  // ── Render gates — children NEVER render until verified=true ──
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-zinc-500 text-sm">Redirecting to Microsoft login...</p>
      </div>
    );
  }

  // verified=null means we're mid-redirect to /checking — show nothing
  if (verified !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  if (requiredRoles?.length > 0 && !hasRequiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-zinc-500 text-sm">Checking permissions...</p>
      </div>
    );
  }

  return children;
}
