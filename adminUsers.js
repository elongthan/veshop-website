"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { revalidatePath } from "next/cache";

async function requireAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return user;
}

// Called from the login page BEFORE the person is authenticated, so it
// uses the service-role client — but only ever returns an email (never a
// password or anything else) for a username that exists, or null.
export async function resolveUsernameToEmail(username) {
  const supabase = createServiceRoleClient();
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("user_id")
    .eq("username", username.trim())
    .maybeSingle();
  if (!profile) return null;

  const { data, error } = await supabase.auth.admin.getUserById(profile.user_id);
  if (error || !data?.user?.email) return null;
  return data.user.email;
}

export async function listAdmins() {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { data } = await supabase.from("admin_profiles").select("user_id, username, created_at").order("created_at");
  return data || [];
}

export async function createAdmin({ username, email, password }) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  if (!username?.trim() || !email?.trim() || !password) {
    throw new Error("Username, email and password are all required.");
  }

  const admin = createServiceRoleClient();

  const { data: existingUsername } = await admin
    .from("admin_profiles")
    .select("user_id")
    .eq("username", username.trim())
    .maybeSingle();
  if (existingUsername) throw new Error("That username is already taken.");

  const { data: created, error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true
  });
  if (error) throw new Error(error.message);

  const { error: profileErr } = await admin
    .from("admin_profiles")
    .insert({ user_id: created.user.id, username: username.trim() });
  if (profileErr) throw new Error(profileErr.message);

  revalidatePath("/admin/users");
}

export async function removeAdmin(userId) {
  const supabase = await createClient();
  const currentUser = await requireAdmin(supabase);
  if (currentUser.id === userId) throw new Error("You can't remove your own account while signed in as it.");

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}

export async function setMyUsername(username) {
  const supabase = await createClient();
  const user = await requireAdmin(supabase);
  if (!username?.trim()) throw new Error("Enter a username.");

  const { data: taken } = await supabase
    .from("admin_profiles")
    .select("user_id")
    .eq("username", username.trim())
    .maybeSingle();
  if (taken && taken.user_id !== user.id) throw new Error("That username is already taken.");

  const { error } = await supabase
    .from("admin_profiles")
    .upsert({ user_id: user.id, username: username.trim() });
  if (error) throw new Error(error.message);
}

export async function getMyUsername() {
  const supabase = await createClient();
  const user = await requireAdmin(supabase);
  const { data } = await supabase.from("admin_profiles").select("username").eq("user_id", user.id).maybeSingle();
  return data?.username || "";
}

export async function changeMyPassword(newPassword) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}
