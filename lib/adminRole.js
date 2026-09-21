// Shared by every actions/*.js file that needs to gate a full-admin-only
// operation (site settings, categories/brands structure, managing other
// admin accounts, bulk-deleting everything). Every signed-in admin account
// can already do the everyday product-management work; this only narrows
// the smaller set of structural/account-level actions.
export async function requireFullAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  // No profile row, or role not yet set, defaults to full admin — accounts
  // created before this feature existed should never get unexpectedly
  // locked out of something they already had access to.
  if (profile && profile.role === "staff") {
    throw new Error("This action is only available to full admin accounts.");
  }
  return user;
}
