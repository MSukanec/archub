// api/lib/handlers/learning/updateLessonProgress.ts
import type { LearningHandlerContext } from './shared.js';
import { getAuthenticatedUser } from './shared.js';

export interface UpdateLessonProgressParams {
  lessonId: string;
  progress_pct?: number;
  last_position_sec?: number;
  completed_at?: string;
  is_completed?: boolean;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  progress_pct: number;
  last_position_sec: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type UpdateLessonProgressResult =
  | { success: true; data: LessonProgress }
  | { success: false; error: string };

export async function updateLessonProgress(
  ctx: LearningHandlerContext,
  params: UpdateLessonProgressParams
): Promise<UpdateLessonProgressResult> {
  try {
    const { supabase } = ctx;
    const { lessonId, progress_pct, last_position_sec, completed_at, is_completed } = params;

    const dbUser = await getAuthenticatedUser(ctx);
    if (!dbUser) {
      return { success: false, error: 'User not found in database' };
    }

    // Auto-complete when progress >= 95%
    const normalizedProgress = progress_pct || 0;
    const shouldAutoComplete = normalizedProgress >= 95;
    const finalIsCompleted = is_completed !== undefined ? is_completed : shouldAutoComplete;
    const finalCompletedAt = (finalIsCompleted || shouldAutoComplete) 
      ? (completed_at || new Date().toISOString()) 
      : null;

    // Upsert progress
    const { data, error } = await supabase
      .from('course_lesson_progress')
      .upsert({
        user_id: dbUser.id,
        lesson_id: lessonId,
        progress_pct: normalizedProgress,
        last_position_sec: last_position_sec || 0,
        completed_at: finalCompletedAt,
        is_completed: finalIsCompleted,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lesson_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting lesson progress:', error);
      return { success: false, error: 'Failed to update progress' };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in updateLessonProgress handler:', error);
    return { success: false, error: error.message || 'Failed to update progress' };
  }
}
