import { SupabaseClient } from "@supabase/supabase-js";

export type UserData = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
};

export async function getUserData(
  supabase: SupabaseClient,
  authId: string
): Promise<UserData> {
  const { data: userRow } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("auth_id", authId)
    .maybeSingle();

  const id = userRow?.id || '';
  const email = userRow?.email || null;
  const fullNameParts = userRow?.full_name?.trim().split(" ") ?? [];
  const firstName = fullNameParts[0] || "Usuario";
  const lastName = fullNameParts.length > 1 
    ? fullNameParts.slice(1).join(" ") 
    : "Seencel";

  return { id, email, firstName, lastName };
}
