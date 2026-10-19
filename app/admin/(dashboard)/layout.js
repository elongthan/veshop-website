import AdminSidebar from "@/components/AdminSidebar";
import { getMyRole } from "@/actions/adminUsers";

export const metadata = { robots: { index: false, follow: false } };

// Admin pages are always built fresh and never use saved copies of data.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminLayout({ children }) {
  const role = await getMyRole();
  return (
    <div className="ve-admin">
      <AdminSidebar role={role} />
      <div className="ve-admin-content">{children}</div>
    </div>
  );
}
