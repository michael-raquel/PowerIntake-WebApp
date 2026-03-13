import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { loginRequest } from "@/lib/msalConfig";
import { useAuth } from "@/context/AuthContext";

const getUserRole = (roles = []) => {
  if (roles.includes('SuperAdmin')) return 'super-admin';
  if (roles.includes('Admin')) return 'admin';
  if (roles.includes('Manager')) return 'manager';
  return 'user';
};

export default function Home() {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();
  const { tokenInfo } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isAuthenticated && tokenInfo) {
      const role = getUserRole(tokenInfo.account.roles);
      router.push(`/${role}/home`);
    }
  }, [isAuthenticated, tokenInfo, router, mounted]);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      {isAuthenticated ? (
        <p className="text-zinc-600">Redirecting...</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            You are not signed in.
          </p>
          <button
            onClick={() => instance.loginRedirect(loginRequest)}
            className="rounded-full bg-black px-6 py-2 text-white hover:bg-zinc-800"
          >
            Sign in with Microsoft
          </button>
        </div>
      )}
    </div>

    
  );
}