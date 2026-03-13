import { useRouter } from "next/router";

export default function RoleManagePage() {
  const router = useRouter();
  const role = typeof router.query.role === "string" ? router.query.role : "user";
  const roleLabel = role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  if (role === "user") {
    return <div className="p-6">Manage is not available for User role.</div>;
  }

  return <div className="p-6">Manage Page {roleLabel}</div>;
}
