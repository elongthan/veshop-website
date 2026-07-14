import AdminSidebar from "@/components/AdminSidebar";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  return (
    <div className="ve-admin">
      <AdminSidebar />
      <div className="ve-admin-content">{children}</div>
    </div>
  );
}
