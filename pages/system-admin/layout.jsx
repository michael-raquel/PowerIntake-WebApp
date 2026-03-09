import AuthGuard from "@/components/AuthGuard";

export default function SystemAdminLayout({ children }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}