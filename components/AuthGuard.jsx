import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect } from "react";
import { loginRequest } from "@/lib/msalConfig";

export default function AuthGuard({ children }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();

  useEffect(() => {
    if (!isAuthenticated) {
      instance.loginRedirect(loginRequest);
    }
  }, [isAuthenticated, instance]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">
          Redirecting to Microsoft login...
        </p>
      </div>
    );
  }

  return children;
}
