import AuthGuard from "@/components/AuthGuard";

export default function UserLayout({ children }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}