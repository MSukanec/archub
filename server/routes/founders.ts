import type { Express, Request, Response } from "express";
import type { RouteDeps } from "./_base";
import { extractToken, requireUser, verifyAdminUser, HttpError } from '../lib/auth/helpers.js';
import { supabaseAdmin } from '../lib/supabase/admin.js';

/**
 * Helper to verify that the user belongs to a founder organization
 * Returns the user's organization info if valid, throws HttpError if not
 */
async function requireFounderAccess(token: string): Promise<{
  userId: string;
  organizationId: string;
  supabase: ReturnType<typeof import('../lib/auth/helpers.js').createAuthenticatedClient>;
}> {
  const user = await requireUser(token);
  
  // Get user's current organization from preferences
  const { data: prefs, error: prefsError } = await user.supabase
    .from('user_preferences')
    .select('last_organization_id')
    .eq('user_id', user.userId)
    .single();

  if (prefsError || !prefs?.last_organization_id) {
    throw new HttpError(403, "User has no active organization selected");
  }

  const organizationId = prefs.last_organization_id;

  // Check membership in that organization
  const { data: membership, error: memberError } = await user.supabase
    .from('organization_members')
    .select('id, is_active')
    .eq('user_id', user.userId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (memberError || !membership) {
    throw new HttpError(403, "User is not an active member of the current organization");
  }

  // Get organization settings to check founder status
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('id, settings')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    throw new HttpError(403, "Organization not found");
  }

  const settings = org.settings || {};
  
  if (!settings.is_founder) {
    throw new HttpError(403, "Access restricted to founder organizations");
  }

  return {
    userId: user.userId,
    organizationId: organizationId,
    supabase: user.supabase
  };
}

/**
 * Register all founders portal endpoints
 */
export function registerFounderRoutes(app: Express, deps: RouteDeps): void {
  // ==================== EVENTS ====================
  
  // GET /api/founders/events - List all events (upcoming first)
  app.get("/api/founders/events", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      await requireFounderAccess(token!);

      const { data: events, error } = await supabaseAdmin
        .from('founder_portal_events')
        .select(`
          *,
          registrations:founder_event_registrations(count)
        `)
        .eq('is_deleted', false)
        .order('event_date', { ascending: true });

      if (error) throw new HttpError(500, error.message);

      return res.json(events);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/founders/events/:id - Get single event with registrations count
  app.get("/api/founders/events/:id", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      await requireFounderAccess(token!);
      const { id } = req.params;

      const { data: event, error } = await supabaseAdmin
        .from('founder_portal_events')
        .select(`
          *,
          registrations:founder_event_registrations(
            id,
            user_id,
            organization_id,
            registered_at,
            attended
          )
        `)
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) throw new HttpError(404, "Event not found");

      return res.json({
        ...event,
        registrations_count: event.registrations?.length || 0
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // POST /api/founders/events - Create event (admin only)
  app.post("/api/founders/events", async (req: Request, res: Response) => {
    try {
      await verifyAdminUser(req.headers.authorization);

      const { data: event, error } = await supabaseAdmin
        .from('founder_portal_events')
        .insert(req.body)
        .select()
        .single();

      if (error) throw new HttpError(400, error.message);

      return res.status(201).json(event);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/founders/events/:id - Update event (admin only)
  app.patch("/api/founders/events/:id", async (req: Request, res: Response) => {
    try {
      await verifyAdminUser(req.headers.authorization);
      const { id } = req.params;

      const { data: event, error } = await supabaseAdmin
        .from('founder_portal_events')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new HttpError(400, error.message);

      return res.json(event);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/founders/events/:id - Soft delete event (admin only)
  app.delete("/api/founders/events/:id", async (req: Request, res: Response) => {
    try {
      await verifyAdminUser(req.headers.authorization);
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from('founder_portal_events')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw new HttpError(400, error.message);

      return res.json({ success: true });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // POST /api/founders/events/:id/register - Register current user to event
  app.post("/api/founders/events/:id/register", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const founder = await requireFounderAccess(token!);
      const { id: eventId } = req.params;

      // Check if already registered
      const { data: existing } = await supabaseAdmin
        .from('founder_event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', founder.userId)
        .maybeSingle();

      if (existing) {
        throw new HttpError(400, "Already registered for this event");
      }

      const { data: registration, error } = await supabaseAdmin
        .from('founder_event_registrations')
        .insert({
          event_id: eventId,
          organization_id: founder.organizationId,
          user_id: founder.userId
        })
        .select()
        .single();

      if (error) throw new HttpError(400, error.message);

      return res.status(201).json(registration);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/founders/events/:id/register - Unregister from event
  app.delete("/api/founders/events/:id/register", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const founder = await requireFounderAccess(token!);
      const { id: eventId } = req.params;

      const { error } = await supabaseAdmin
        .from('founder_event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', founder.userId);

      if (error) throw new HttpError(400, error.message);

      return res.json({ success: true });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // ==================== VOTING ====================

  // GET /api/founders/votes - List all vote topics with vote counts
  app.get("/api/founders/votes", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      await requireFounderAccess(token!);

      const { data: topics, error } = await supabaseAdmin
        .from('founder_vote_topics')
        .select(`
          *,
          options:founder_vote_options(*),
          ballots:founder_vote_ballots(count)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw new HttpError(500, error.message);

      return res.json(topics);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/founders/votes/:id - Get vote topic with options and results
  app.get("/api/founders/votes/:id", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const founder = await requireFounderAccess(token!);
      const { id } = req.params;

      const { data: topic, error } = await supabaseAdmin
        .from('founder_vote_topics')
        .select(`
          *,
          options:founder_vote_options(*)
        `)
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) throw new HttpError(404, "Vote topic not found");

      // Get vote counts per option
      const { data: ballotCounts } = await supabaseAdmin
        .from('founder_vote_ballots')
        .select('option_id')
        .eq('topic_id', id);

      const voteCounts: Record<string, number> = {};
      ballotCounts?.forEach((ballot: any) => {
        voteCounts[ballot.option_id] = (voteCounts[ballot.option_id] || 0) + 1;
      });

      // Check if current user has voted
      const { data: userBallot } = await supabaseAdmin
        .from('founder_vote_ballots')
        .select('option_id')
        .eq('topic_id', id)
        .eq('user_id', founder.userId)
        .maybeSingle();

      return res.json({
        ...topic,
        vote_counts: voteCounts,
        total_votes: ballotCounts?.length || 0,
        user_voted_option_id: userBallot?.option_id || null
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // POST /api/founders/votes - Create vote topic (admin only)
  app.post("/api/founders/votes", async (req: Request, res: Response) => {
    try {
      await verifyAdminUser(req.headers.authorization);
      const { options, ...topicData } = req.body;

      // Create topic
      const { data: topic, error: topicError } = await supabaseAdmin
        .from('founder_vote_topics')
        .insert(topicData)
        .select()
        .single();

      if (topicError) throw new HttpError(400, topicError.message);

      // Create options if provided
      if (options && Array.isArray(options) && options.length > 0) {
        const optionsWithTopic = options.map((opt: any, idx: number) => ({
          topic_id: topic.id,
          option_text: opt.option_text || opt,
          option_order: idx
        }));

        const { error: optionsError } = await supabaseAdmin
          .from('founder_vote_options')
          .insert(optionsWithTopic);

        if (optionsError) throw new HttpError(400, optionsError.message);
      }

      // Return topic with options
      const { data: fullTopic } = await supabaseAdmin
        .from('founder_vote_topics')
        .select(`*, options:founder_vote_options(*)`)
        .eq('id', topic.id)
        .single();

      return res.status(201).json(fullTopic);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // POST /api/founders/votes/:id/cast - Cast a vote (one per org/user/topic)
  app.post("/api/founders/votes/:id/cast", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const founder = await requireFounderAccess(token!);
      const { id: topicId } = req.params;
      const { option_id } = req.body;

      if (!option_id) {
        throw new HttpError(400, "option_id is required");
      }

      // Check if topic is active
      const { data: topic } = await supabaseAdmin
        .from('founder_vote_topics')
        .select('status, voting_deadline')
        .eq('id', topicId)
        .eq('is_deleted', false)
        .single();

      if (!topic || topic.status !== 'active') {
        throw new HttpError(400, "Voting is not open for this topic");
      }

      if (topic.voting_deadline && new Date(topic.voting_deadline) < new Date()) {
        throw new HttpError(400, "Voting deadline has passed");
      }

      // Check if already voted
      const { data: existing } = await supabaseAdmin
        .from('founder_vote_ballots')
        .select('id')
        .eq('topic_id', topicId)
        .eq('user_id', founder.userId)
        .maybeSingle();

      if (existing) {
        throw new HttpError(400, "You have already voted on this topic");
      }

      const { data: ballot, error } = await supabaseAdmin
        .from('founder_vote_ballots')
        .insert({
          topic_id: topicId,
          option_id,
          organization_id: founder.organizationId,
          user_id: founder.userId
        })
        .select()
        .single();

      if (error) throw new HttpError(400, error.message);

      return res.status(201).json(ballot);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/founders/votes/:id/results - Get vote results
  app.get("/api/founders/votes/:id/results", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      await requireFounderAccess(token!);
      const { id } = req.params;

      const { data: topic, error: topicError } = await supabaseAdmin
        .from('founder_vote_topics')
        .select(`*, options:founder_vote_options(*)`)
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (topicError) throw new HttpError(404, "Vote topic not found");

      // Get all ballots with organization info
      const { data: ballots } = await supabaseAdmin
        .from('founder_vote_ballots')
        .select(`
          option_id,
          organizations (
            id,
            name,
            logo_url
          )
        `)
        .eq('topic_id', id);

      // Calculate results
      const results: Record<string, { count: number; organizations: any[] }> = {};
      topic.options?.forEach((opt: any) => {
        results[opt.id] = { count: 0, organizations: [] };
      });

      ballots?.forEach((ballot: any) => {
        if (results[ballot.option_id]) {
          results[ballot.option_id].count++;
          if (ballot.organizations) {
            results[ballot.option_id].organizations.push(ballot.organizations);
          }
        }
      });

      return res.json({
        topic,
        results,
        total_votes: ballots?.length || 0
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // ==================== FORUM ====================

  // GET /api/founders/forum/threads - List threads (paginated, newest first)
  app.get("/api/founders/forum/threads", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      await requireFounderAccess(token!);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const category = req.query.category as string;

      let query = supabaseAdmin
        .from('founder_forum_threads')
        .select(`
          *,
          author:users!founder_forum_threads_user_id_fkey(id, full_name, avatar_url),
          organization:organizations!founder_forum_threads_organization_id_fkey(id, name),
          posts:founder_forum_posts(count)
        `, { count: 'exact' })
        .eq('is_deleted', false)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (category) {
        query = query.eq('category', category);
      }

      const { data: threads, error, count } = await query;

      if (error) throw new HttpError(500, error.message);

      return res.json({
        threads,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/founders/forum/threads/:id - Get thread with posts
  app.get("/api/founders/forum/threads/:id", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      await requireFounderAccess(token!);
      const { id } = req.params;

      const { data: thread, error } = await supabaseAdmin
        .from('founder_forum_threads')
        .select(`
          *,
          author:users!founder_forum_threads_user_id_fkey(id, full_name, avatar_url),
          organization:organizations!founder_forum_threads_organization_id_fkey(id, name),
          posts:founder_forum_posts(
            *,
            author:users!founder_forum_posts_user_id_fkey(id, full_name, avatar_url),
            organization:organizations!founder_forum_posts_organization_id_fkey(id, name)
          )
        `)
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) throw new HttpError(404, "Thread not found");

      // Filter out deleted posts
      if (thread.posts) {
        thread.posts = thread.posts.filter((p: any) => !p.is_deleted);
      }

      return res.json(thread);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // POST /api/founders/forum/threads - Create new thread
  app.post("/api/founders/forum/threads", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const founder = await requireFounderAccess(token!);

      const { data: thread, error } = await supabaseAdmin
        .from('founder_forum_threads')
        .insert({
          ...req.body,
          organization_id: founder.organizationId,
          user_id: founder.userId
        })
        .select()
        .single();

      if (error) throw new HttpError(400, error.message);

      return res.status(201).json(thread);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/founders/forum/threads/:id - Update thread (author only)
  app.patch("/api/founders/forum/threads/:id", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const founder = await requireFounderAccess(token!);
      const { id } = req.params;

      // Check ownership
      const { data: existing } = await supabaseAdmin
        .from('founder_forum_threads')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!existing || existing.user_id !== founder.userId) {
        throw new HttpError(403, "You can only edit your own threads");
      }

      const { data: thread, error } = await supabaseAdmin
        .from('founder_forum_threads')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new HttpError(400, error.message);

      return res.json(thread);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/founders/forum/threads/:id - Soft delete thread (author or admin)
  app.delete("/api/founders/forum/threads/:id", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const { id } = req.params;

      // Try admin first
      let isAdmin = false;
      try {
        await verifyAdminUser(req.headers.authorization);
        isAdmin = true;
      } catch {
        // Not admin, check ownership
      }

      if (!isAdmin) {
        const founder = await requireFounderAccess(token!);
        const { data: existing } = await supabaseAdmin
          .from('founder_forum_threads')
          .select('user_id')
          .eq('id', id)
          .single();

        if (!existing || existing.user_id !== founder.userId) {
          throw new HttpError(403, "You can only delete your own threads");
        }
      }

      const { error } = await supabaseAdmin
        .from('founder_forum_threads')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw new HttpError(400, error.message);

      return res.json({ success: true });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // POST /api/founders/forum/threads/:id/posts - Add reply to thread
  app.post("/api/founders/forum/threads/:id/posts", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const founder = await requireFounderAccess(token!);
      const { id: threadId } = req.params;

      // Check thread exists and not locked
      const { data: thread } = await supabaseAdmin
        .from('founder_forum_threads')
        .select('id, is_locked')
        .eq('id', threadId)
        .eq('is_deleted', false)
        .single();

      if (!thread) {
        throw new HttpError(404, "Thread not found");
      }

      if (thread.is_locked) {
        throw new HttpError(403, "Thread is locked");
      }

      const { data: post, error } = await supabaseAdmin
        .from('founder_forum_posts')
        .insert({
          thread_id: threadId,
          content: req.body.content,
          organization_id: founder.organizationId,
          user_id: founder.userId
        })
        .select()
        .single();

      if (error) throw new HttpError(400, error.message);

      // Update thread's updated_at
      await supabaseAdmin
        .from('founder_forum_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', threadId);

      return res.status(201).json(post);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/founders/forum/posts/:id - Update post (author only)
  app.patch("/api/founders/forum/posts/:id", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const founder = await requireFounderAccess(token!);
      const { id } = req.params;

      // Check ownership
      const { data: existing } = await supabaseAdmin
        .from('founder_forum_posts')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!existing || existing.user_id !== founder.userId) {
        throw new HttpError(403, "You can only edit your own posts");
      }

      const { data: post, error } = await supabaseAdmin
        .from('founder_forum_posts')
        .update({ content: req.body.content, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new HttpError(400, error.message);

      return res.json(post);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/founders/forum/posts/:id - Soft delete post (author or admin)
  app.delete("/api/founders/forum/posts/:id", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const { id } = req.params;

      // Try admin first
      let isAdmin = false;
      try {
        await verifyAdminUser(req.headers.authorization);
        isAdmin = true;
      } catch {
        // Not admin, check ownership
      }

      if (!isAdmin) {
        const founder = await requireFounderAccess(token!);
        const { data: existing } = await supabaseAdmin
          .from('founder_forum_posts')
          .select('user_id')
          .eq('id', id)
          .single();

        if (!existing || existing.user_id !== founder.userId) {
          throw new HttpError(403, "You can only delete your own posts");
        }
      }

      const { error } = await supabaseAdmin
        .from('founder_forum_posts')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw new HttpError(400, error.message);

      return res.json({ success: true });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // ==================== ADMIN ====================

  // POST /api/founders/admin/toggle-founder/:orgId - Toggle founder status (admin only)
  app.post("/api/founders/admin/toggle-founder/:orgId", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      await verifyAdminUser(token!);
      const { orgId } = req.params;

      // Get current organization settings
      const { data: org, error: fetchError } = await supabaseAdmin
        .from('organizations')
        .select('id, name, settings')
        .eq('id', orgId)
        .single();

      if (fetchError || !org) {
        throw new HttpError(404, "Organization not found");
      }

      const currentSettings = org.settings || {};
      const newIsFounder = !currentSettings.is_founder;

      // Update settings
      const { error: updateError } = await supabaseAdmin
        .from('organizations')
        .update({ 
          settings: { 
            ...currentSettings, 
            is_founder: newIsFounder 
          } 
        })
        .eq('id', orgId);

      if (updateError) throw new HttpError(500, updateError.message);

      return res.json({ 
        success: true, 
        is_founder: newIsFounder,
        message: newIsFounder ? 'Organización marcada como fundadora' : 'Organización removida de fundadores'
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // ==================== DIRECTORY ====================

  // GET /api/founders/directory - List all founder organizations
  app.get("/api/founders/directory", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      await requireFounderAccess(token!);

      const { data: organizations, error } = await supabaseAdmin
        .from('organizations')
        .select(`
          id,
          name,
          created_at,
          created_by,
          settings
        `)
        .eq('is_deleted', false)
        .eq('is_active', true);

      if (error) {
        console.error('Directory query error:', error);
        throw new HttpError(500, error.message);
      }

      // Filter only founder organizations
      const founderOrgs = organizations?.filter((org: any) => 
        org.settings?.is_founder === true
      ) || [];

      // Get creator names in batch if we have organizations
      if (founderOrgs.length > 0) {
        const creatorIds = founderOrgs.map(org => org.created_by).filter(Boolean);
        let creatorMap: Record<string, string> = {};

        if (creatorIds.length > 0) {
          const { data: creators, error: creatorsError } = await supabaseAdmin
            .from('users')
            .select('id, full_name')
            .in('id', creatorIds);

          if (!creatorsError && creators) {
            creatorMap = creators.reduce((acc, user) => {
              acc[user.id] = user.full_name;
              return acc;
            }, {} as Record<string, string>);
          }
        }

        // Add creator_name to each organization
        return res.json(founderOrgs.map((org: any) => ({
          ...org,
          creator_name: org.created_by ? creatorMap[org.created_by] : undefined
        })));
      }

      return res.json(founderOrgs);
    } catch (error: any) {
      console.error('Directory endpoint error:', error);
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });
}
