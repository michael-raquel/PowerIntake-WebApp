import { useEffect } from "react";
import { useRouter } from "next/router";

export default function RoleIndexPage() {
  const router = useRouter();
  const role = typeof router.query.role === "string" ? router.query.role : null;

  useEffect(() => {
    if (!role) return;
    router.replace(`/${role}/home`);
  }, [role, router]);

  return <div className="p-6">Redirecting...</div>;
}
