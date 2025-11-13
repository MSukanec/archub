import { SupabaseClient } from "@supabase/supabase-js";

export type UserData = {
  email: string | null;
  firstName: string;
  lastName: string;
};

export async function getUserData(
  supabase: SupabaseClient,
  userId: string
): Promise<UserData> {
  const { data: userRow } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();

  const email = userRow?.email || null;
  const fullNameParts = userRow?.full_name?.trim().split(" ") ?? [];
  const firstName = fullNameParts[0] || "Usuario";
  const lastName = fullNameParts.length > 1 
    ? fullNameParts.slice(1).join(" ") 
    : "Seencel";

  return { email, firstName, lastName };
}
