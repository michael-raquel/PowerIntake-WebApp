import AuthGuard from "@/components/ui/AuthGuard";

export default function SystemAdminLayout({ children }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}