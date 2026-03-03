import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home({ user }) {
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/user/home");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      {user ? (
        <p className="text-zinc-600">Redirecting...</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            You are not signed in.
          </p>
          <a
            href="/.auth/login/aad"
            className="rounded-full bg-black px-6 py-2 text-white hover:bg-zinc-800"
          >
            Sign in with Microsoft
          </a>
        </div>
      )}
    </div>
  );
}
