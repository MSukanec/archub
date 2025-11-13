import { SupabaseClient } from "@supabase/supabase-js";

function addMonths(d: Date, months: number): Date {
  const n = new Date(d);
  n.setMonth(n.getMonth() + months);
  return n;
}

export async function upsertEnrollment(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  months?: number | null
): Promise<void> {
  const startedAt = new Date();
  const expiresAt = months && months > 0 ? addMonths(startedAt, months) : null;

  const { error } = await supabase.from("course_enrollments").upsert(
    {
      user_id: userId,
      course_id: courseId,
      status: "active",
      started_at: startedAt.toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" },
  );
  
  if (error) {
    console.error("[enrollments] upsertEnrollment error:", error);
  } else {
    console.log("[enrollments] ✅ Enrollment created/updated");
  }
}
