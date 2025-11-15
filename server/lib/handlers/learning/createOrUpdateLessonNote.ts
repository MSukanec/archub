// api/lib/handlers/learning/createOrUpdateLessonNote.ts
import type { LearningHandlerContext } from './shared.js';
import { getAuthenticatedUser } from './shared.js';

export interface CreateOrUpdateLessonNoteParams {
  lessonId: string;
  body: string;
  time_sec?: number | null;
  is_pinned?: boolean;
}

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

export type CreateOrUpdateLessonNoteResult =
  | { success: true; data: LessonNote }
  | { success: false; error: string };

export async function createOrUpdateLessonNote(
  ctx: LearningHandlerContext,
  params: CreateOrUpdateLessonNoteParams
): Promise<CreateOrUpdateLessonNoteResult> {
  try {
    const { supabase } = ctx;
    const { lessonId, body, time_sec, is_pinned } = params;

    // Validate body
    if (body === undefined || typeof body !== 'string') {
      return { success: false, error: 'Body must be a string' };
    }

    const dbUser = await getAuthenticatedUser(ctx);
    if (!dbUser) {
      return { success: false, error: 'User not found' };
    }

    // Check if there's an existing note without time_sec (general note)
    const { data: existingNote } = await supabase
      .from('course_lesson_notes')
      .select('*')
      .eq('user_id', dbUser.id)
      .eq('lesson_id', lessonId)
      .is('time_sec', null)
      .maybeSingle();

    let noteData;

    if (existingNote) {
      // Update existing general note
      const { data, error } = await supabase
        .from('course_lesson_notes')
        .update({
          body,
          is_pinned: is_pinned ?? false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingNote.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating note:', error);
        return { success: false, error: 'Failed to update note' };
      }

      noteData = data;
    } else {
      // Insert new note
      const { data, error } = await supabase
        .from('course_lesson_notes')
        .insert({
          user_id: dbUser.id,
          lesson_id: lessonId,
          body,
          time_sec: time_sec || null,
          is_pinned: is_pinned ?? false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating note:', error);
        return { success: false, error: 'Failed to create note' };
      }

      noteData = data;
    }

    return { success: true, data: noteData };
  } catch (error: any) {
    console.error('Error in createOrUpdateLessonNote handler:', error);
    return { success: false, error: error.message || 'Failed to process note' };
  }
}
