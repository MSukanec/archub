// api/_lib/handlers/learning/getLessonNotes.ts
import type { LearningHandlerContext } from './shared.js';
import { getAuthenticatedUser } from './shared.js';

export interface LessonNote {
  id: string;
  user_id: string;
  lesson_id: string;
  body: string;
  time_sec: number | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetLessonNotesParams {
  lessonId: string;
}

export type GetLessonNotesResult =
  | { success: true; data: LessonNote[] }
  | { success: false; error: string };

export async function getLessonNotes(
  ctx: LearningHandlerContext,
  params: GetLessonNotesParams
): Promise<GetLessonNotesResult> {
  try {
    const { supabase } = ctx;
    const { lessonId } = params;

    const dbUser = await getAuthenticatedUser(ctx);
    if (!dbUser) {
      return { success: false, error: 'User not found' };
    }

    const { data: notes, error } = await supabase
      .from('course_lesson_notes')
      .select('*')
      .eq('user_id', dbUser.id)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lesson notes:', error);
      return { success: false, error: 'Failed to fetch notes' };
    }

    return { success: true, data: notes || [] };
  } catch (error: any) {
    console.error('Error in getLessonNotes handler:', error);
    return { success: false, error: error.message || 'Failed to fetch notes' };
  }
}
