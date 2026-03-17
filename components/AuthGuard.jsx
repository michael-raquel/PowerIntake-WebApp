import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { loginRequest } from "@/lib/msalConfig";

export default function AuthGuard({ children, requiredRoles }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      instance.loginRedirect(loginRequest);
    }
  }, [isAuthenticated, instance]);

  const hasRequiredRole = useMemo(() => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    const account = accounts[0];
    const roles = (account?.idTokenClaims?.roles ?? []).map(String);
    return requiredRoles.some((role) => roles.includes(role));
  }, [accounts, requiredRoles]);

  useEffect(() => {
    if (
      isAuthenticated &&
      requiredRoles &&
      requiredRoles.length > 0 &&
      !hasRequiredRole
    ) {
      router.replace("/home");
    }
  }, [isAuthenticated, requiredRoles, hasRequiredRole, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">
          Redirecting to Microsoft login...
        </p>
      </div>
    );
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasRequiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">
          You do not have access to this page. Redirecting...
        </p>
      </div>
    );
  }

  return children;
}
