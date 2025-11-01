import type { Express } from "express";
import type { RouteDeps } from './_base';
import { extractToken, createAuthenticatedClient } from './_base';

// Simple in-memory cache for recent notes and markers
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 1000; // 30 seconds

function getCacheKey(endpoint: string, userId: string, courseId: string): string {
  return `${endpoint}:${userId}:${courseId}`;
}

function getFromCache(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Register course-related endpoints (lessons progress, notes, enrollments, dashboard)
 * All endpoints require authentication as they handle user-specific data.
 */
export function registerCourseRoutes(app: Express, deps: RouteDeps): void {
  const { supabase } = deps;

  // ========== LESSON PROGRESS ENDPOINTS ==========

  // POST /api/lessons/:lessonId/progress - Mark lesson progress/complete
  app.post("/api/lessons/:lessonId/progress", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { progress_pct, last_position_sec, completed_at, is_completed } = req.body;
      
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user from Supabase Auth
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: existingUser, error: userLookupError } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (userLookupError || !existingUser) {

        return res.status(404).json({ error: "User not found in database" });
      }
      
      // Use the CORRECT user_id from users table
      const dbUserId = existingUser.id;
      
      // Upsert progress
      // Auto-complete when progress >= 95%
      const normalizedProgress = progress_pct || 0;
      const shouldAutoComplete = normalizedProgress >= 95;
      const finalIsCompleted = is_completed !== undefined ? is_completed : shouldAutoComplete;
      const finalCompletedAt = (finalIsCompleted || shouldAutoComplete) ? (completed_at || new Date().toISOString()) : null;
      
      const { data, error } = await authenticatedSupabase
        .from('course_lesson_progress')
        .upsert({
          user_id: dbUserId,
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
        return res.status(500).json({ error: "Failed to update progress" });
      }
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // POST /api/lessons/:lessonId/favorite - Toggle lesson as favorite
  app.post("/api/lessons/:lessonId/favorite", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { is_favorite } = req.body; // true or false
      
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user from Supabase Auth
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: existingUser, error: userLookupError } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (userLookupError || !existingUser) {

        return res.status(404).json({ error: "User not found in database" });
      }
      
      const dbUserId = existingUser.id;
      
      // Upsert progress with favorite status
      // Si el usuario no tiene progreso, lo creamos con valores por defecto
      const { data, error } = await authenticatedSupabase
        .from('course_lesson_progress')
        .upsert({
          user_id: dbUserId,
          lesson_id: lessonId,
          is_favorite: is_favorite,
          progress_pct: 0,  // Default si es nuevo
          last_position_sec: 0,  // Default si es nuevo
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        })
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ error: "Failed to toggle favorite" });
      }
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  });

  // GET /api/courses/:courseId/progress - Get all lesson progress for a course
  app.get("/api/courses/:courseId/progress", async (req, res) => {
    try {
      const { courseId } = req.params;
      
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json([]);
      }
      
      // Get all modules for the course
      const { data: modules, error: modulesError } = await authenticatedSupabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);
      
      if (modulesError || !modules) {
        return res.status(500).json({ error: "Failed to fetch course modules" });
      }
      
      const moduleIds = modules.map(m => m.id);
      
      if (moduleIds.length === 0) {
        return res.json([]);
      }
      
      // Get all lessons for these modules
      const { data: lessons, error: lessonsError } = await authenticatedSupabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds);
      
      if (lessonsError || !lessons) {
        return res.status(500).json({ error: "Failed to fetch lessons" });
      }
      
      const lessonIds = lessons.map(l => l.id);
      
      if (lessonIds.length === 0) {
        return res.json([]);
      }
      
      // Get progress for all lessons
      const { data: progress, error: progressError } = await authenticatedSupabase
        .from('course_lesson_progress')
        .select('*')
        .eq('user_id', dbUser.id)
        .in('lesson_id', lessonIds);
      
      if (progressError) {
        return res.status(500).json({ error: "Failed to fetch progress" });
      }
      
      res.json(progress || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // ========== LESSON NOTES ENDPOINTS ==========

  // GET /api/lessons/:lessonId/notes - Get all notes for a lesson
  app.get("/api/lessons/:lessonId/notes", async (req, res) => {
    try {
      const { lessonId } = req.params;
      
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { data: notes, error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });
      
      if (error) {
        return res.status(500).json({ error: "Failed to fetch notes" });
      }
      
      res.json(notes || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  // POST /api/lessons/:lessonId/notes - Create or update a lesson note
  app.post("/api/lessons/:lessonId/notes", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { body, time_sec, is_pinned } = req.body;
      
      if (body === undefined || typeof body !== 'string') {
        return res.status(400).json({ error: "Body must be a string" });
      }
      
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { data: existingNote } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .is('time_sec', null)
        .single();
      
      let noteData;
      
      if (existingNote) {
        const { data, error } = await authenticatedSupabase
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
          return res.status(500).json({ error: "Failed to update note" });
        }
        
        noteData = data;
      } else {
        const { data, error } = await authenticatedSupabase
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
          return res.status(500).json({ error: "Failed to create note" });
        }
        
        noteData = data;
      }
      
      res.json(noteData);
    } catch (error) {
      res.status(500).json({ error: "Failed to save note" });
    }
  });

  // ========== OPTIMIZED SUMMARY NOTE ENDPOINTS ==========

  // GET /api/lessons/:lessonId/summary-note - Get summary note for a lesson (optimized)
  app.get("/api/lessons/:lessonId/summary-note", async (req, res) => {
    try {
      const { lessonId } = req.params;
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // WORKAROUND for stack depth issue - fetch all notes and filter in memory
      const { data: allNotes, error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId);
      
      if (error) {
        return res.status(500).json({ error: "Failed to fetch summary note" });
      }
      
      // Filter for summary note in memory
      const note = (allNotes || []).find(n => n.note_type === 'summary') || null;
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch summary note" });
    }
  });

  // PUT /api/lessons/:lessonId/summary-note - Upsert summary note (optimized)
  app.put("/api/lessons/:lessonId/summary-note", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { body } = req.body;
      
      if (body === undefined || typeof body !== 'string') {
        return res.status(400).json({ error: "Body must be a string" });
      }
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check for existing summary note
      // WORKAROUND for stack depth issue - fetch all notes and filter in memory
      const { data: allNotes } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('id, note_type')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId);
      
      // Filter for summary note in memory
      const existingNote = (allNotes || []).find(n => n.note_type === 'summary') || null;
      
      let noteData;
      
      if (existingNote) {
        // Update existing note
        const { data, error } = await authenticatedSupabase
          .from('course_lesson_notes')
          .update({
            body,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingNote.id)
          .select()
          .single();
        
        if (error) {
          return res.status(500).json({ error: "Failed to update summary note" });
        }
        
        noteData = data;
      } else {
        // Insert new note
        const { data, error } = await authenticatedSupabase
          .from('course_lesson_notes')
          .insert({
            user_id: dbUser.id,
            lesson_id: lessonId,
            note_type: 'summary',
            body,
            time_sec: null,
            is_pinned: false
          })
          .select()
          .single();
        
        if (error) {
          return res.status(500).json({ error: "Failed to create summary note" });
        }
        
        noteData = data;
      }
      
      res.json(noteData);
    } catch (error) {
      res.status(500).json({ error: "Failed to save summary note" });
    }
  });

  // DELETE /api/lessons/:lessonId/summary-note - Delete summary note (optimized)
  app.delete("/api/lessons/:lessonId/summary-note", async (req, res) => {
    try {
      const { lessonId } = req.params;
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // WORKAROUND for stack depth issue - fetch all notes first
      const { data: allNotes } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('id, note_type')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId);
      
      // Filter for summary notes in memory
      const summaryNotes = (allNotes || []).filter(n => n.note_type === 'summary');
      
      // Delete each summary note by ID
      if (summaryNotes.length > 0) {
        const { error } = await authenticatedSupabase
          .from('course_lesson_notes')
          .delete()
          .in('id', summaryNotes.map(n => n.id));
        
        if (error) {
    
          return res.status(500).json({ error: "Failed to delete summary note" });
        }
      }
      
      res.json({ success: true });
    } catch (error) {

      res.status(500).json({ error: "Failed to delete summary note" });
    }
  });

  // DELETE /api/notes/:noteId - Delete a note by ID (generic endpoint for CourseNotesTab/CourseMarkersTab)
  app.delete("/api/notes/:noteId", async (req, res) => {
    try {
      const { noteId } = req.params;
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', dbUser.id);
      
      if (error) {
  
        return res.status(500).json({ error: "Failed to delete note" });
      }
      
      res.json({ success: true });
    } catch (error) {

      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // ========== OPTIMIZED MARKERS ENDPOINTS ==========

  // GET /api/lessons/:lessonId/markers - Get all markers for a lesson (optimized)
  app.get("/api/lessons/:lessonId/markers", async (req, res) => {
    try {
      const { lessonId } = req.params;
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // WORKAROUND for stack depth issue - fetch all notes and filter in memory
      const { data: allNotes, error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .order('is_pinned', { ascending: false })
        .order('time_sec', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (error) {
        return res.status(500).json({ error: "Failed to fetch markers" });
      }
      
      // Filter markers in memory (markers have time_sec and note_type='marker')
      const markers = (allNotes || []).filter(note => 
        note.note_type === 'marker' || (note.time_sec !== null && note.note_type !== 'summary')
      );
      
      res.json(markers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch markers" });
    }
  });

  // POST /api/lessons/:lessonId/markers - Create a new marker (optimized)
  app.post("/api/lessons/:lessonId/markers", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { body, time_sec } = req.body;
      
      if (time_sec === undefined || typeof time_sec !== 'number') {
        return res.status(400).json({ error: "time_sec must be a number" });
      }
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { data: marker, error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .insert({
          user_id: dbUser.id,
          lesson_id: lessonId,
          note_type: 'marker',
          body: body || '',
          time_sec,
          is_pinned: false
        })
        .select()
        .single();
      
      if (error) {
  
        return res.status(500).json({ error: "Failed to create marker" });
      }
      
      res.json(marker);
    } catch (error) {

      res.status(500).json({ error: "Failed to create marker" });
    }
  });

  // PATCH /api/lessons/:lessonId/markers/:markerId - Update a marker (optimized)
  app.patch("/api/lessons/:lessonId/markers/:markerId", async (req, res) => {
    try {
      const { lessonId, markerId } = req.params;
      const { body, is_pinned } = req.body;
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (body !== undefined) updateData.body = body;
      if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
      
      // WORKAROUND for stack depth issue - first verify the marker exists and has correct type
      const { data: existingNote } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('id, note_type')
        .eq('id', markerId)
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .single();
      
      // Check if it's a marker note
      if (!existingNote || existingNote.note_type !== 'marker') {
        return res.status(404).json({ error: "Marker not found" });
      }
      
      const { data: marker, error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .update(updateData)
        .eq('id', markerId)
        .select()
        .single();
      
      if (error) {
  
        return res.status(500).json({ error: "Failed to update marker" });
      }
      
      res.json(marker);
    } catch (error) {

      res.status(500).json({ error: "Failed to update marker" });
    }
  });

  // DELETE /api/lessons/:lessonId/markers/:markerId - Delete a marker (optimized)
  app.delete("/api/lessons/:lessonId/markers/:markerId", async (req, res) => {
    try {
      const { lessonId, markerId } = req.params;
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // WORKAROUND for stack depth issue - first verify the marker exists and has correct type
      const { data: existingNote } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('id, note_type')
        .eq('id', markerId)
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .single();
      
      // Check if it's a marker note
      if (!existingNote || existingNote.note_type !== 'marker') {
        return res.status(404).json({ error: "Marker not found" });
      }
      
      const { error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .delete()
        .eq('id', markerId);
      
      if (error) {
  
        return res.status(500).json({ error: "Failed to delete marker" });
      }
      
      res.json({ success: true });
    } catch (error) {

      res.status(500).json({ error: "Failed to delete marker" });
    }
  });

  // ========== COURSE NOTES & MARKERS ENDPOINTS (OPTIMIZED) ==========

  // GET /api/courses/:courseId/recent-notes - Get latest 3 notes for a course (OPTIMIZED WITH JOIN)
  app.get("/api/courses/:courseId/recent-notes", async (req, res) => {
    try {
      const { courseId } = req.params;
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json([]);
      }
      
      // Check cache first
      const cacheKey = getCacheKey('recent-notes', dbUser.id, courseId);
      const cachedData = getFromCache(cacheKey);
      if (cachedData !== null) {
        return res.json(cachedData);
      }
      
      // ONE QUERY with JOINs: notes -> lessons -> modules
      // This replaces the complex batching logic
      const { data: notesWithLesson, error: notesError } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('id, body, lesson_id, created_at, course_lessons!inner(id, title, course_modules!inner(course_id))')
        .eq('user_id', dbUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (notesError) {
        console.error('Error fetching recent notes:', notesError);
        const emptyResult: any[] = [];
        setCache(cacheKey, emptyResult);
        return res.json(emptyResult);
      }
      
      if (!notesWithLesson || notesWithLesson.length === 0) {
        const emptyResult: any[] = [];
        setCache(cacheKey, emptyResult);
        return res.json(emptyResult);
      }
      
      // Filter for summary notes from this specific course and take first 3
      const courseNotes = notesWithLesson
        .filter((note: any) => {
          // Filter for summary notes (in memory to avoid stack depth)
          if (note.note_type !== 'summary' && !note.course_lessons?.course_modules) return false;
          
          // Check if the lesson belongs to this course
          const modules = note.course_lessons?.course_modules;
          if (!modules) return false;
          
          // Handle both single object and array responses from Supabase
          const courseIdMatch = Array.isArray(modules)
            ? modules.some((m: any) => m.course_id === courseId)
            : modules.course_id === courseId;
          
          return courseIdMatch && note.note_type === 'summary';
        })
        .slice(0, 3)
        .map((note: any) => ({
          id: note.id,
          body: note.body,
          lesson_id: note.lesson_id,
          created_at: note.created_at,
          course_lessons: {
            id: note.course_lessons?.id,
            title: note.course_lessons?.title
          }
        }));
      
      // Cache the result
      setCache(cacheKey, courseNotes);
      
      res.json(courseNotes);
    } catch (error) {
      console.error('Error in recent-notes endpoint:', error);
      res.json([]);
    }
  });

  // GET /api/courses/:courseId/recent-markers - Get latest 3 markers for a course (OPTIMIZED WITH JOIN)
  app.get("/api/courses/:courseId/recent-markers", async (req, res) => {
    try {
      const { courseId } = req.params;
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json([]);
      }
      
      // Check cache first
      const cacheKey = getCacheKey('recent-markers', dbUser.id, courseId);
      const cachedData = getFromCache(cacheKey);
      if (cachedData !== null) {
        return res.json(cachedData);
      }
      
      // ONE QUERY with JOINs: notes -> lessons -> modules
      // This replaces the complex batching logic
      const { data: markersWithLesson, error: markersError } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('id, body, lesson_id, created_at, time_sec, note_type, course_lessons!inner(id, title, course_modules!inner(course_id))')
        .eq('user_id', dbUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (markersError) {
        console.error('Error fetching recent markers:', markersError);
        const emptyResult: any[] = [];
        setCache(cacheKey, emptyResult);
        return res.json(emptyResult);
      }
      
      if (!markersWithLesson || markersWithLesson.length === 0) {
        const emptyResult: any[] = [];
        setCache(cacheKey, emptyResult);
        return res.json(emptyResult);
      }
      
      // Filter for markers from this specific course and take first 3
      // Markers are notes with note_type='marker' OR (time_sec not null AND note_type != 'summary')
      const courseMarkers = markersWithLesson
        .filter((note: any) => {
          // Check if the lesson belongs to this course
          const modules = note.course_lessons?.course_modules;
          if (!modules) return false;
          
          // Handle both single object and array responses from Supabase
          const courseIdMatch = Array.isArray(modules)
            ? modules.some((m: any) => m.course_id === courseId)
            : modules.course_id === courseId;
          
          if (!courseIdMatch) return false;
          
          // Filter for markers (in memory to avoid stack depth issues)
          return note.note_type === 'marker' || 
                 (note.time_sec !== null && note.note_type !== 'summary');
        })
        .slice(0, 3)
        .map((note: any) => ({
          id: note.id,
          body: note.body,
          lesson_id: note.lesson_id,
          created_at: note.created_at,
          time_sec: note.time_sec,
          lesson_info: {
            id: note.course_lessons?.id,
            title: note.course_lessons?.title
          }
        }));
      
      // Cache the result
      setCache(cacheKey, courseMarkers);
      
      res.json(courseMarkers);
    } catch (error) {
      console.error('Error in recent-markers endpoint:', error);
      res.json([]);
    }
  });

  // GET /api/courses/:courseId/notes - Get all notes for a course (OPTIMIZED)
  app.get("/api/courses/:courseId/notes", async (req, res) => {
    try {
      const { courseId } = req.params;
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json([]);
      }
      
      // Query 1: Get all modules for this course
      const { data: courseModules, error: modulesError } = await authenticatedSupabase
        .from('course_modules')
        .select('id, title, sort_index')
        .eq('course_id', courseId);
      
      if (modulesError || !courseModules || courseModules.length === 0) {
        return res.json([]);
      }
      
      const moduleIds = courseModules.map(m => m.id);
      
      // Query 2: Get all lessons for these modules
      const { data: courseLessons, error: lessonsError } = await authenticatedSupabase
        .from('course_lessons')
        .select('id, title, module_id')
        .in('module_id', moduleIds);
      
      if (lessonsError || !courseLessons || courseLessons.length === 0) {
        return res.json([]);
      }
      
      const lessonIds = courseLessons.map(l => l.id);
      
      // Query 3: WORKAROUND for stack depth issue - fetch all notes and filter in memory
      // This avoids the problematic note_type='summary' database filter that causes timeouts
      const { data: allNotes, error: notesError } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });
      
      if (notesError) {
        // Return empty array instead of error to prevent app crash
        return res.json([]);
      }
      
      // Filter summary notes in memory (much faster than database filter)
      const summaryNotes = (allNotes || []).filter(note => note.note_type === 'summary');
      
      // Create lookup maps for efficient combination
      const lessonMap = new Map(courseLessons.map(l => [l.id, l]));
      const moduleMap = new Map(courseModules.map(m => [m.id, m]));
      
      // Combine data in memory
      const enrichedNotes = summaryNotes.map(note => {
        const lesson = lessonMap.get(note.lesson_id);
        const module = lesson ? moduleMap.get(lesson.module_id) : null;
        
        return {
          ...note,
          lesson: lesson ? { title: lesson.title, module_id: lesson.module_id } : null,
          module: module ? { title: module.title, sort_index: module.sort_index } : null
        };
      });
      
      res.json(enrichedNotes);
    } catch (error) {
      // Return empty array instead of error to prevent app crash
      res.json([]);
    }
  });

  // GET /api/courses/:courseId/markers - Get all markers for a course (OPTIMIZED)
  app.get("/api/courses/:courseId/markers", async (req, res) => {
    try {
      const { courseId } = req.params;
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json([]);
      }
      
      // Query 1: Get all modules for this course
      const { data: courseModules, error: modulesError } = await authenticatedSupabase
        .from('course_modules')
        .select('id, title, sort_index')
        .eq('course_id', courseId);
      
      if (modulesError || !courseModules || courseModules.length === 0) {
        return res.json([]);
      }
      
      const moduleIds = courseModules.map(m => m.id);
      
      // Query 2: Get all lessons for these modules
      const { data: courseLessons, error: lessonsError } = await authenticatedSupabase
        .from('course_lessons')
        .select('id, title, module_id')
        .in('module_id', moduleIds);
      
      if (lessonsError || !courseLessons || courseLessons.length === 0) {
        return res.json([]);
      }
      
      const lessonIds = courseLessons.map(l => l.id);
      
      // Query 3: WORKAROUND for stack depth issue - fetch all notes and filter in memory
      // This avoids the problematic note_type='marker' database filter
      const { data: allNotes, error: markersError } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });
      
      if (markersError) {
        // Return empty array instead of error to prevent app crash
        return res.json([]);
      }
      
      // Filter markers in memory (markers have time_sec and note_type='marker')
      const markers = (allNotes || []).filter(note => 
        note.note_type === 'marker' || (note.time_sec !== null && note.note_type !== 'summary')
      );
      
      // Create lookup maps for efficient combination
      const lessonMap = new Map(courseLessons.map(l => [l.id, l]));
      const moduleMap = new Map(courseModules.map(m => [m.id, m]));
      
      // Combine data in memory
      const enrichedMarkers = markers.map(marker => {
        const lesson = lessonMap.get(marker.lesson_id);
        const module = lesson ? moduleMap.get(lesson.module_id) : null;
        
        return {
          ...marker,
          lesson: lesson ? { title: lesson.title, module_id: lesson.module_id } : null,
          module: module ? { title: module.title, sort_index: module.sort_index } : null
        };
      });
      
      res.json(enrichedMarkers);
    } catch (error) {
      // Return empty array instead of error to prevent app crash
      res.json([]);
    }
  });

  // ========== USER PROGRESS ENDPOINTS ==========

  // GET /api/user/all-progress - Get all lesson progress for current user
  app.get("/api/user/all-progress", async (req, res) => {
    try {
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json([]);
      }
      
      // Get all progress for this user
      const { data: progress, error: progressError } = await authenticatedSupabase
        .from('course_lesson_progress')
        .select('*')
        .eq('user_id', dbUser.id);
      
      if (progressError) {
        return res.status(500).json({ error: "Failed to fetch progress" });
      }
      
      
      res.json(progress || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // GET /api/user/enrollments - Get all course enrollments for current user
  app.get("/api/user/enrollments", async (req, res) => {
    try {
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current auth user
      const { data: { user: authUser }, error: authUserError } = await authenticatedSupabase.auth.getUser();
      
      if (authUserError || !authUser || !authUser.email) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get the user record from the users table using auth_id
      const { data: userRecord, error: userRecordError } = await authenticatedSupabase
        .from('users')
        .select('id, email')
        .eq('auth_id', authUser.id)
        .maybeSingle();
      
      if (userRecordError || !userRecord) {
        return res.json([]);
      }
      
      // Get all enrollments for this user with course slug
      const { data: enrollments, error: enrollmentsError} = await authenticatedSupabase
        .from('course_enrollments')
        .select('*, courses(slug)')
        .eq('user_id', userRecord.id);
      
      if (enrollmentsError) {
        return res.status(500).json({ error: "Failed to fetch enrollments" });
      }
      
      // Flatten the course slug
      const formattedEnrollments = (enrollments || []).map((e: any) => ({
        ...e,
        course_slug: e.courses?.slug
      }));
      
      res.json(formattedEnrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  // ========== ULTRA-OPTIMIZED COURSES WITH ENROLLMENT ==========
  
  // GET /api/learning/courses-full - ONE query to get ALL course data + enrollments + progress
  // 🚀 CRITICAL: This endpoint is optimized for instant page loads (sub-second)
  app.get("/api/learning/courses-full", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current auth user
      const { data: { user: authUser }, error: authUserError } = await authenticatedSupabase.auth.getUser();
      
      if (authUserError || !authUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user record
      const { data: userRecord, error: userRecordError } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .maybeSingle();
      
      if (userRecordError || !userRecord) {
        return res.json({ courses: [], enrollments: [], progress: [] });
      }
      
      // 🚀 Execute ALL queries in parallel for maximum speed
      const [coursesResult, enrollmentsResult, progressResult] = await Promise.all([
        // Get all active courses
        authenticatedSupabase
          .from('courses')
          .select('id, slug, title, short_description, cover_url, is_active, visibility')
          .eq('is_active', true)
          .neq('visibility', 'draft'),
        
        // Get user's enrollments
        authenticatedSupabase
          .from('course_enrollments')
          .select('id, course_id, user_id, status, created_at, updated_at, courses(slug)')
          .eq('user_id', userRecord.id),
        
        // Get user's progress from optimized view
        authenticatedSupabase
          .from('course_progress_view')
          .select('*')
          .eq('user_id', userRecord.id)
      ]);
      
      if (coursesResult.error) {
        return res.status(500).json({ error: 'Failed to fetch courses' });
      }
      
      // Flatten enrollment data
      const enrollments = (enrollmentsResult.data || []).map((e: any) => ({
        ...e,
        course_slug: e.courses?.slug
      }));
      
      // 🔍 DEBUG: Log enrollments to see what we're returning
      
      res.json({
        courses: coursesResult.data || [],
        enrollments: enrollments,
        progress: progressResult.data || []
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== LEARNING DASHBOARD ENDPOINT ==========

  // Simple in-memory cache for dashboard data
  const dashboardCache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_TTL = 30000; // 30 seconds cache

  // GET /api/learning/dashboard - Consolidated endpoint for dashboard data
  app.get("/api/learning/dashboard", async (req, res) => {
    try {
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json({
          enrollments: [],
          progress: [],
          courseLessons: [],
          recentCompletions: []
        });
      }
      
      // Check cache first
      const cacheKey = `dashboard_${dbUser.id}`;
      const cached = dashboardCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return res.json(cached.data);
      }
      
      // Get enrollments first (small query)
      const { data: enrollments, error: enrollmentsError } = await authenticatedSupabase
        .from('course_enrollments')
        .select('*, courses(id, slug, title)')
        .eq('user_id', dbUser.id);
      
      if (enrollmentsError) {
        throw enrollmentsError;
      }
      
      // If no enrollments, return early
      if (!enrollments || enrollments.length === 0) {
        return res.json({
          enrollments: [],
          courses: [],
          global: null,
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          recentCompletions: []
        });
      }
      
      // 🚀 OPTIMIZACIÓN: Usar vistas pre-calculadas en paralelo con timing logs
      const startTotal = Date.now();
      
      // Execute each query with timing
      const startGlobal = Date.now();
      const globalProgressPromise = authenticatedSupabase
        .from('course_user_global_progress_view')
        .select('*')
        .eq('user_id', dbUser.id)
        .maybeSingle()
        .then(result => {
          return result;
        });
      
      const startCourse = Date.now();
      const courseProgressPromise = authenticatedSupabase
        .from('course_progress_view')
        .select('*')
        .eq('user_id', dbUser.id)
        .then(result => {
          return result;
        });
      
      const startStudy = Date.now();
      const studyTimePromise = authenticatedSupabase
        .from('course_user_study_time_view')
        .select('*')
        .eq('user_id', dbUser.id)
        .maybeSingle()
        .then(result => {
          return result;
        });
      
      const startActive = Date.now();
      const activeDaysPromise = authenticatedSupabase
        .from('course_user_active_days_view')
        .select('*')
        .eq('user_id', dbUser.id)
        .then(result => {
          return result;
        });
      
      const startCompletions = Date.now();
      const recentCompletionsPromise = authenticatedSupabase
        .from('course_lesson_completions_view')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('is_completed', true)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10)
        .then(result => {
          return result;
        });
      
      const [
        globalProgressResult,
        courseProgressResult,
        studyTimeResult,
        activeDaysResult,
        recentCompletionsResult
      ] = await Promise.all([
        globalProgressPromise,
        courseProgressPromise,
        studyTimePromise,
        activeDaysPromise,
        recentCompletionsPromise
      ]);
      
      
      // Log individual query results for debugging
      if (globalProgressResult.error || courseProgressResult.error || studyTimeResult.error || 
          activeDaysResult.error || recentCompletionsResult.error) {
      }
      
      // Check for errors
      if (globalProgressResult.error) {
        throw globalProgressResult.error;
      }
      if (courseProgressResult.error) {
        throw courseProgressResult.error;
      }
      if (studyTimeResult.error) {
        throw studyTimeResult.error;
      }
      if (activeDaysResult.error) {
        throw activeDaysResult.error;
      }
      if (recentCompletionsResult.error) {
        throw recentCompletionsResult.error;
      }
      
      // Datos ya pre-calculados de las vistas
      const globalProgress = globalProgressResult.data;
      const courseProgress = courseProgressResult.data || [];
      const studyTime = studyTimeResult.data;
      const activeDays = activeDaysResult.data || [];
      
      // Mapear progreso por curso con info de enrollment
      const courses = enrollments.map((enrollment: any) => {
        const progress = courseProgress.find((p: any) => p.course_id === enrollment.course_id);
        
        return {
          course_id: enrollment.course_id,
          course_title: enrollment.courses?.title || 'Sin título',
          course_slug: enrollment.courses?.slug || '',
          progress_pct: progress ? Math.round(progress.progress_pct) : 0,
          done_lessons: progress?.done_lessons || 0,
          total_lessons: progress?.total_lessons || 0
        };
      });
      
      // Calcular streak (días consecutivos desde hoy hacia atrás)
      const sortedDays = activeDays
        .map((d: any) => d.day)
        .sort((a, b) => b.localeCompare(a));
      
      let currentStreak = 0;
      for (let i = 0; i < sortedDays.length; i++) {
        const expectedDate = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        if (sortedDays[i] === expectedDate) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // Format recent completions (view already has flat structure!)
      const recentCompletions = (recentCompletionsResult.data || []).map((completion: any) => {
        return {
          type: 'completed',
          when: completion.completed_at,
          lesson_title: completion.lesson_title || 'Sin título',
          module_title: completion.module_title || 'Sin módulo',
          course_title: completion.course_title || 'Sin curso',
          course_slug: completion.course_slug || ''
        };
      });
      
      // Prepare response data
      const responseData = {
        global: globalProgress ? {
          done_lessons_total: globalProgress.done_lessons_total || 0,
          total_lessons_total: globalProgress.total_lessons_total || 0,
          progress_pct: Math.round(globalProgress.progress_pct || 0)
        } : {
          done_lessons_total: 0,
          total_lessons_total: 0,
          progress_pct: 0
        },
        courses: courses,
        study: {
          seconds_lifetime: studyTime?.seconds_lifetime || 0,
          seconds_this_month: studyTime?.seconds_this_month || 0
        },
        currentStreak,
        activeDays: activeDays.length,
        recentCompletions
      };
      
      // Store in cache
      dashboardCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });
      
      // Return pre-calculated data (no heavy computation needed!)
      res.json(responseData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // ========== OPTIMIZED LEARNING DASHBOARD ENDPOINT (V2) ==========
  
  // GET /api/learning/dashboard-fast - Optimized version using bulk queries + in-memory combination
  app.get("/api/learning/dashboard-fast", async (req, res) => {
    try {
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json({
          global: null,
          courses: [],
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          activeDays: 0,
          recentCompletions: []
        });
      }
      
      // BULK QUERY 1: Get enrollments with course info
      const { data: enrollments } = await authenticatedSupabase
        .from('course_enrollments')
        .select('course_id, courses!inner(id, title, slug)')
        .eq('user_id', dbUser.id);
        
      if (!enrollments || enrollments.length === 0) {
        return res.json({
          global: null,
          courses: [],
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          activeDays: 0,
          recentCompletions: []
        });
      }
      
      const courseIds = enrollments.map(e => e.course_id);
      
      // BULK QUERY 2: Get ALL modules for these courses (NO JOINS)
      const { data: modules } = await authenticatedSupabase
        .from('course_modules')
        .select('id, course_id, title')
        .in('course_id', courseIds);
      
      if (!modules || modules.length === 0) {
        return res.json({
          global: null,
          courses: [],
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          activeDays: 0,
          recentCompletions: []
        });
      }
      
      const moduleIds = modules.map(m => m.id);
      
      // BULK QUERY 3: Get ALL lessons for these modules (NO JOINS)
      const { data: lessons } = await authenticatedSupabase
        .from('course_lessons')
        .select('id, module_id, title, duration_sec, is_active')
        .in('module_id', moduleIds)
        .eq('is_active', true);
      
      if (!lessons || lessons.length === 0) {
        return res.json({
          global: null,
          courses: [],
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          activeDays: 0,
          recentCompletions: []
        });
      }
      
      const lessonIds = lessons.map(l => l.id);
      
      // BULK QUERY 4: Get progress for ALL lessons (NO JOINS - just user_id and lesson IDs)
      const { data: progressData } = await authenticatedSupabase
        .from('course_lesson_progress')
        .select('lesson_id, is_completed, completed_at, last_position_sec')
        .eq('user_id', dbUser.id)
        .in('lesson_id', lessonIds);
      
      
      // CREATE LOOKUP MAPS for in-memory combination
      const moduleMap = new Map(modules.map(m => [m.id, m]));
      const lessonMap = new Map(lessons.map(l => [l.id, l]));
      const progressMap = new Map((progressData || []).map(p => [p.lesson_id, p]));
      
      // Initialize course progress tracking
      const progressByCourse = new Map();
      const completedLessons = [];
      let totalCompleted = 0;
      let totalLessons = 0;
      let totalStudyTime = 0;
      const activeDaysSet = new Set();
      
      // Initialize courses with zero progress
      for (const enrollment of enrollments) {
        const course = Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses;
        progressByCourse.set(enrollment.course_id, {
          completed: 0,
          total: 0,
          course_id: enrollment.course_id,
          title: course?.title,
          slug: course?.slug
        });
      }
      
      // Count lessons per course and calculate progress
      for (const lesson of lessons) {
        const module = moduleMap.get(lesson.module_id);
        if (!module) continue;
        
        const courseId = module.course_id;
        const courseProgress = progressByCourse.get(courseId);
        if (!courseProgress) continue;
        
        // Increment total lessons for this course
        courseProgress.total++;
        totalLessons++;
        
        // Check if this lesson is completed
        const progress = progressMap.get(lesson.id);
        if (progress) {
          // Track study time
          if (progress.last_position_sec) {
            totalStudyTime += progress.last_position_sec;
          }
          
          // Track completed lessons
          if (progress.is_completed) {
            courseProgress.completed++;
            totalCompleted++;
            
            // Track for recent completions
            if (progress.completed_at) {
              completedLessons.push({
                completed_at: progress.completed_at,
                lesson_title: lesson.title || 'Sin título',
                module_title: module.title || 'Sin módulo',
                course_title: courseProgress.title || 'Sin curso',
                course_slug: courseProgress.slug || ''
              });
              
              // Track active days
              const day = new Date(progress.completed_at).toISOString().slice(0, 10);
              activeDaysSet.add(day);
            }
          }
        }
      }
      
      // Format courses with progress
      const courses = Array.from(progressByCourse.values()).map(course => ({
        course_id: course.course_id,
        course_title: course.title || 'Sin título',
        course_slug: course.slug || '',
        progress_pct: course.total > 0 ? Math.round((course.completed / course.total) * 100) : 0,
        done_lessons: course.completed,
        total_lessons: course.total
      }));
      
      // Calculate global progress
      const globalProgress = totalLessons > 0 ? {
        done_lessons_total: totalCompleted,
        total_lessons_total: totalLessons,
        progress_pct: Math.round((totalCompleted / totalLessons) * 100)
      } : null;
      
      // Sort and limit recent completions
      const recentCompletions = completedLessons
        .sort((a: any, b: any) => b.completed_at.localeCompare(a.completed_at))
        .slice(0, 10)
        .map((c: any) => ({
          type: 'completed',
          when: c.completed_at,
          ...c
        }));
      
      // Calculate current streak
      const sortedDays = Array.from(activeDaysSet).sort((a: string, b: string) => b.localeCompare(a));
      let currentStreak = 0;
      
      for (let i = 0; i < sortedDays.length; i++) {
        const expectedDate = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        if (sortedDays[i] === expectedDate) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // Return optimized response
      res.json({
        global: globalProgress,
        courses: courses,
        study: {
          seconds_lifetime: totalStudyTime,
          seconds_this_month: totalStudyTime
        },
        currentStreak,
        activeDays: activeDaysSet.size,
        recentCompletions
      });
      
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
}
