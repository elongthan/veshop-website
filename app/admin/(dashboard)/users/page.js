import { listAdmins } from "@/actions/adminUsers";
import UsersClient from "@/components/admin/UsersClient";

export default async function AdminUsersPage() {
  const admins = await listAdmins();
  return <UsersClient admins={admins} />;
}
