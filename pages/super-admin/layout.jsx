import AuthGuard from "@/components/ui/AuthGuard";

export default function SuperAdminLayout({ children }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}