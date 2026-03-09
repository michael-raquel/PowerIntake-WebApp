import AuthGuard from "@/components/ui/AuthGuard";

export default function ManagerLayout({ children }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}