import { SupabaseClient } from "@supabase/supabase-js";

export async function getCourseIdBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error("[helpers] getCourseIdBySlug error:", error);
    return null;
  }
  
  return data?.id ?? null;
}

export async function getPlanIdBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error("[helpers] getPlanIdBySlug error:", error);
    return null;
  }
  
  return data?.id ?? null;
}

export async function getCourseDataBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<{ id: string; title: string; slug: string; description: string } | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, slug, short_description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    description: data.short_description || data.title,
  };
}

export async function getPlanDataBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<{ id: string; name: string; slug: string } | null> {
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
  };
}
