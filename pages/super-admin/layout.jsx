import AuthGuard from "@/components/AuthGuard";

export default function SuperAdminLayout({ children }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}