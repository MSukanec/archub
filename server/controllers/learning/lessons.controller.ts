import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  getLessonNotes,
  type GetLessonNotesParams,
  type GetLessonNotesResult
} from '../../lib/handlers/learning/getLessonNotes.js';
import {
  createOrUpdateLessonNote,
  type CreateOrUpdateLessonNoteParams,
  type CreateOrUpdateLessonNoteResult
} from '../../lib/handlers/learning/createOrUpdateLessonNote.js';
import {
  updateLessonProgress,
  type UpdateLessonProgressParams,
  type UpdateLessonProgressResult
} from '../../lib/handlers/learning/updateLessonProgress.js';
import type { LearningHandlerContext } from '../../lib/handlers/learning/shared.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

function createAuthenticatedClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function handleGetLessonNotes(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: LearningHandlerContext = { supabase };

    const params: GetLessonNotesParams = {
      lessonId: req.params.id
    };

    const result = await getLessonNotes(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in handleGetLessonNotes controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch lesson notes' });
  }
}

export async function handleCreateOrUpdateLessonNote(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: LearningHandlerContext = { supabase };

    const params: CreateOrUpdateLessonNoteParams = {
      lessonId: req.params.id,
      body: req.body.body,
      time_sec: req.body.time_sec,
      is_pinned: req.body.is_pinned
    };

    const result = await createOrUpdateLessonNote(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in handleCreateOrUpdateLessonNote controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to create/update lesson note' });
  }
}

export async function handleUpdateLessonProgress(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: LearningHandlerContext = { supabase };

    const params: UpdateLessonProgressParams = {
      lessonId: req.params.id,
      progress_pct: req.body.progress_pct,
      last_position_sec: req.body.last_position_sec,
      completed_at: req.body.completed_at,
      is_completed: req.body.is_completed
    };

    const result = await updateLessonProgress(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in handleUpdateLessonProgress controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to update lesson progress' });
  }
}
