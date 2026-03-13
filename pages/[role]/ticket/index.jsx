import { useRouter } from "next/router";
import TicketWorkspace from "@/pages/[role]/ticket/components/TicketWorkspace";

export default function DynamicRoleTicketPage() {
  const router = useRouter();
  const routeRole = typeof router.query.role === "string" ? router.query.role : null;

  return <TicketWorkspace routeRole={routeRole} />;
}
