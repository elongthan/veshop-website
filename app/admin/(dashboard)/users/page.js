import { redirect } from "next/navigation";
import { listAdmins, getMyRole } from "@/actions/adminUsers";
import UsersClient from "@/components/admin/UsersClient";

export default async function AdminUsersPage() {
  if ((await getMyRole()) === "staff") redirect("/admin/products");
  const admins = await listAdmins();
  return <UsersClient admins={admins} />;
}
