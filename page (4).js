import { getMyUsername } from "@/actions/adminUsers";
import AccountClient from "@/components/admin/AccountClient";

export default async function AdminAccountPage() {
  const username = await getMyUsername();
  return <AccountClient currentUsername={username} />;
}
