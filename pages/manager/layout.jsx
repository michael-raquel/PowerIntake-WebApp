import AuthGuard from "@/components/AuthGuard";

export default function ManagerLayout({ children }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}