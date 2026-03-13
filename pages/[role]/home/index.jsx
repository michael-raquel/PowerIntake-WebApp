import { useRouter } from "next/router";

export default function RoleHomePage() {
  const router = useRouter();
  const role = typeof router.query.role === "string" ? router.query.role : "user";
  const roleLabel = role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Home Page {roleLabel}</h1>
    </div>
  );
}
