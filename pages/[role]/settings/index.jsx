import { useRouter } from "next/router";
import ComUserTable from "./components/ComUserTable";

export default function RoleSettingsPage() {
  const router = useRouter();
  const role = typeof router.query.role === "string" ? router.query.role : "user";
  const roleLabel = role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  if (role === "user") {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Settings Page User</h1>
        <ComUserTable />
      </div>
    );
  }

  return <div className="p-6">Settings Page {roleLabel}</div>;
}
