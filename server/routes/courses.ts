import type { Express } from "express";
import type { RouteDeps } from './_base';
import { extractToken, createAuthenticatedClient } from './_base';

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
        console.error("User not found in users table:", user.id, userLookupError);
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
        console.error("Error upserting lesson progress:", error);
        return res.status(500).json({ error: "Failed to update progress" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error updating lesson progress:", error);
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
        console.error("User not found in users table:", user.id, userLookupError);
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
        console.error("Error toggling lesson favorite:", error);
        return res.status(500).json({ error: "Failed to toggle favorite" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error toggling lesson favorite:", error);
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
        console.error("Error fetching modules:", modulesError);
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
        console.error("Error fetching lessons:", lessonsError);
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
        console.error("Error fetching progress:", progressError);
        return res.status(500).json({ error: "Failed to fetch progress" });
      }
      
      res.json(progress || []);
    } catch (error) {
      console.error("Error fetching course progress:", error);
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
        console.error("Error fetching notes:", error);
        return res.status(500).json({ error: "Failed to fetch notes" });
      }
      
      res.json(notes || []);
    } catch (error) {
      console.error("Error fetching lesson notes:", error);
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
          console.error("Error updating note:", error);
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
          console.error("Error creating note:", error);
          return res.status(500).json({ error: "Failed to create note" });
        }
        
        noteData = data;
      }
      
      res.json(noteData);
    } catch (error) {
      console.error("Error saving lesson note:", error);
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
      
      const { data: note, error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .eq('note_type', 'summary')
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching summary note:", error);
        return res.status(500).json({ error: "Failed to fetch summary note" });
      }
      
      res.json(note);
    } catch (error) {
      console.error("Error fetching summary note:", error);
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
      const { data: existingNote } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('id')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .eq('note_type', 'summary')
        .maybeSingle();
      
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
          console.error("Error updating summary note:", error);
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
          console.error("Error creating summary note:", error);
          return res.status(500).json({ error: "Failed to create summary note" });
        }
        
        noteData = data;
      }
      
      res.json(noteData);
    } catch (error) {
      console.error("Error saving summary note:", error);
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
      
      const { error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .delete()
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .eq('note_type', 'summary');
      
      if (error) {
        console.error("Error deleting summary note:", error);
        return res.status(500).json({ error: "Failed to delete summary note" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting summary note:", error);
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
        console.error("Error deleting note:", error);
        return res.status(500).json({ error: "Failed to delete note" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting note:", error);
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
      
      const { data: markers, error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .eq('note_type', 'marker')
        .order('is_pinned', { ascending: false })
        .order('time_sec', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error fetching markers:", error);
        return res.status(500).json({ error: "Failed to fetch markers" });
      }
      
      res.json(markers || []);
    } catch (error) {
      console.error("Error fetching markers:", error);
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
        console.error("Error creating marker:", error);
        return res.status(500).json({ error: "Failed to create marker" });
      }
      
      res.json(marker);
    } catch (error) {
      console.error("Error creating marker:", error);
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
      
      const { data: marker, error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .update(updateData)
        .eq('id', markerId)
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .eq('note_type', 'marker')
        .select()
        .single();
      
      if (error) {
        console.error("Error updating marker:", error);
        return res.status(500).json({ error: "Failed to update marker" });
      }
      
      res.json(marker);
    } catch (error) {
      console.error("Error updating marker:", error);
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
      
      const { error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .delete()
        .eq('id', markerId)
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .eq('note_type', 'marker');
      
      if (error) {
        console.error("Error deleting marker:", error);
        return res.status(500).json({ error: "Failed to delete marker" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting marker:", error);
      res.status(500).json({ error: "Failed to delete marker" });
    }
  });

  // ========== COURSE NOTES & MARKERS ENDPOINTS (OPTIMIZED) ==========

  // GET /api/courses/:courseId/recent-notes - Get latest 3 notes for a course (OPTIMIZED FOR DASHBOARD)
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
      
      // Query 1: Get all modules for this course
      const { data: courseModules, error: modulesError } = await authenticatedSupabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);
      
      if (modulesError || !courseModules || courseModules.length === 0) {
        return res.json([]);
      }
      
      const moduleIds = courseModules.map(m => m.id);
      
      // Query 2: Get all lessons for these modules
      const { data: courseLessons, error: lessonsError } = await authenticatedSupabase
        .from('course_lessons')
        .select('id, title')
        .in('module_id', moduleIds);
      
      if (lessonsError || !courseLessons || courseLessons.length === 0) {
        return res.json([]);
      }
      
      const lessonIds = courseLessons.map(l => l.id);
      
      // Query 3: Get latest 3 notes for these lessons
      const { data: notes, error: notesError } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('id, body, lesson_id, created_at')
        .eq('user_id', dbUser.id)
        .eq('note_type', 'summary')
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (notesError) {
        console.error("Error fetching recent notes:", notesError);
        return res.status(500).json({ error: "Failed to fetch notes" });
      }
      
      // Combine data with lesson titles
      const lessonMap = new Map(courseLessons.map(l => [l.id, l]));
      const enrichedNotes = (notes || []).map(note => ({
        ...note,
        course_lessons: lessonMap.get(note.lesson_id) || null
      }));
      
      res.json(enrichedNotes);
    } catch (error) {
      console.error("Error fetching recent notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  // GET /api/courses/:courseId/recent-markers - Get latest 3 markers for a course (OPTIMIZED FOR DASHBOARD)
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
      
      // Query 1: Get all modules for this course
      const { data: courseModules, error: modulesError } = await authenticatedSupabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);
      
      if (modulesError || !courseModules || courseModules.length === 0) {
        return res.json([]);
      }
      
      const moduleIds = courseModules.map(m => m.id);
      
      // Query 2: Get all lessons for these modules
      const { data: courseLessons, error: lessonsError } = await authenticatedSupabase
        .from('course_lessons')
        .select('id, title')
        .in('module_id', moduleIds);
      
      if (lessonsError || !courseLessons || courseLessons.length === 0) {
        return res.json([]);
      }
      
      const lessonIds = courseLessons.map(l => l.id);
      
      // Query 3: Get latest 3 markers for these lessons
      const { data: markers, error: markersError } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('id, body, lesson_id, time_sec, created_at')
        .eq('user_id', dbUser.id)
        .eq('note_type', 'marker')
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (markersError) {
        console.error("Error fetching recent markers:", markersError);
        return res.status(500).json({ error: "Failed to fetch markers" });
      }
      
      // Combine data with lesson titles
      const lessonMap = new Map(courseLessons.map(l => [l.id, l]));
      const enrichedMarkers = (markers || []).map(marker => ({
        ...marker,
        course_lessons: lessonMap.get(marker.lesson_id) || null
      }));
      
      res.json(enrichedMarkers);
    } catch (error) {
      console.error("Error fetching recent markers:", error);
      res.status(500).json({ error: "Failed to fetch markers" });
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
      
      // Query 3: Get all summary notes for these lessons
      const { data: notes, error: notesError } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('note_type', 'summary')
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });
      
      if (notesError) {
        console.error("Error fetching notes:", notesError);
        return res.status(500).json({ error: "Failed to fetch notes" });
      }
      
      // Create lookup maps for efficient combination
      const lessonMap = new Map(courseLessons.map(l => [l.id, l]));
      const moduleMap = new Map(courseModules.map(m => [m.id, m]));
      
      // Combine data in memory
      const enrichedNotes = (notes || []).map(note => {
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
      console.error("Error fetching course notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
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
      
      // Query 3: Get all markers for these lessons
      const { data: markers, error: markersError } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('note_type', 'marker')
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });
      
      if (markersError) {
        console.error("Error fetching markers:", markersError);
        return res.status(500).json({ error: "Failed to fetch markers" });
      }
      
      // Create lookup maps for efficient combination
      const lessonMap = new Map(courseLessons.map(l => [l.id, l]));
      const moduleMap = new Map(courseModules.map(m => [m.id, m]));
      
      // Combine data in memory
      const enrichedMarkers = (markers || []).map(marker => {
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
      console.error("Error fetching course markers:", error);
      res.status(500).json({ error: "Failed to fetch markers" });
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
        console.error("Error fetching user progress:", progressError);
        return res.status(500).json({ error: "Failed to fetch progress" });
      }
      
      console.log('📊 /api/user/all-progress returning:', JSON.stringify(progress, null, 2));
      
      res.json(progress || []);
    } catch (error) {
      console.error("Error fetching user progress:", error);
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
        console.error("Error fetching user record:", userRecordError);
        return res.json([]);
      }
      
      // Get all enrollments for this user with course slug
      const { data: enrollments, error: enrollmentsError} = await authenticatedSupabase
        .from('course_enrollments')
        .select('*, courses(slug)')
        .eq('user_id', userRecord.id);
      
      if (enrollmentsError) {
        console.error("Error fetching user enrollments:", enrollmentsError);
        return res.status(500).json({ error: "Failed to fetch enrollments" });
      }
      
      // Flatten the course slug
      const formattedEnrollments = (enrollments || []).map((e: any) => ({
        ...e,
        course_slug: e.courses?.slug
      }));
      
      res.json(formattedEnrollments);
    } catch (error) {
      console.error("Error fetching user enrollments:", error);
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
        console.error('Error fetching courses:', coursesResult.error);
        return res.status(500).json({ error: 'Failed to fetch courses' });
      }
      
      // Flatten enrollment data
      const enrollments = (enrollmentsResult.data || []).map((e: any) => ({
        ...e,
        course_slug: e.courses?.slug
      }));
      
      // 🔍 DEBUG: Log enrollments to see what we're returning
      console.log('📊 ENROLLMENTS DEBUG:', JSON.stringify(enrollments, null, 2));
      console.log('📊 ENROLLMENTS COUNT:', enrollments.length);
      
      res.json({
        courses: coursesResult.data || [],
        enrollments: enrollments,
        progress: progressResult.data || []
      });
    } catch (error) {
      console.error("Error in /api/learning/courses-full:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== LEARNING DASHBOARD ENDPOINT ==========

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
      
      // Get enrollments first (small query)
      const { data: enrollments, error: enrollmentsError } = await authenticatedSupabase
        .from('course_enrollments')
        .select('*, courses(id, slug, title)')
        .eq('user_id', dbUser.id);
      
      if (enrollmentsError) {
        console.error("Error fetching enrollments:", enrollmentsError);
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
      
      // 🚀 OPTIMIZACIÓN: Usar vistas pre-calculadas en paralelo
      const [
        globalProgressResult,
        courseProgressResult,
        studyTimeResult,
        activeDaysResult,
        recentCompletionsResult
      ] = await Promise.all([
        // Vista global de progreso (1 query simple)
        authenticatedSupabase
          .from('course_user_global_progress_view')
          .select('*')
          .eq('user_id', dbUser.id)
          .maybeSingle(),
        
        // Vista de progreso por curso (1 query con join pre-calculado)
        authenticatedSupabase
          .from('course_progress_view')
          .select('*')
          .eq('user_id', dbUser.id),
        
        // Vista de tiempo de estudio (1 query simple)
        authenticatedSupabase
          .from('course_user_study_time_view')
          .select('*')
          .eq('user_id', dbUser.id)
          .maybeSingle(),
        
        // Vista de días activos (1 query simple)
        authenticatedSupabase
          .from('course_user_active_days_view')
          .select('*')
          .eq('user_id', dbUser.id),
        
        // Vista de completados recientes (ya optimizada)
        authenticatedSupabase
          .from('course_lesson_completions_view')
          .select('*')
          .eq('user_id', dbUser.id)
          .eq('is_completed', true)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(10)
      ]);
      
      // Check for errors
      if (globalProgressResult.error) {
        console.error("Error fetching global progress:", globalProgressResult.error);
        throw globalProgressResult.error;
      }
      if (courseProgressResult.error) {
        console.error("Error fetching course progress:", courseProgressResult.error);
        throw courseProgressResult.error;
      }
      if (studyTimeResult.error) {
        console.error("Error fetching study time:", studyTimeResult.error);
        throw studyTimeResult.error;
      }
      if (activeDaysResult.error) {
        console.error("Error fetching active days:", activeDaysResult.error);
        throw activeDaysResult.error;
      }
      if (recentCompletionsResult.error) {
        console.error("Error fetching recent completions:", recentCompletionsResult.error);
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
      
      // Return pre-calculated data (no heavy computation needed!)
      res.json({
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
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
}
