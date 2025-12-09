import type { Express, Request, Response } from "express";
import type { RouteDeps } from "./_base";
import { extractToken, requireUser, verifyAdminUser, HttpError } from '../lib/auth/helpers.js';
import { supabaseAdmin } from '../lib/supabase/admin.js';
import { nanoid } from 'nanoid';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function getUserRoles(userId: string): Promise<string[]> {
  const roles: string[] = ['public'];

  // Run admin check and prefs query in parallel
  const [adminResult, prefsResult] = await Promise.all([
    supabaseAdmin
      .from('admin_users')
      .select('auth_id')
      .eq('auth_id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('user_preferences')
      .select('last_organization_id')
      .eq('user_id', userId)
      .maybeSingle()
  ]);

  if (adminResult.data) {
    roles.push('admin');
  }

  if (prefsResult.data?.last_organization_id) {
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id, settings')
      .eq('id', prefsResult.data.last_organization_id)
      .single();

    if (org?.settings?.is_founder) {
      roles.push('founder');
    }
  }

  return roles;
}

async function getUserOrgId(userId: string): Promise<string | null> {
  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('last_organization_id')
    .eq('user_id', userId)
    .single();

  return prefs?.last_organization_id || null;
}

async function canAccessCategory(userId: string, categoryId: string): Promise<boolean> {
  const userRoles = await getUserRoles(userId);
  
  // Admins can access everything
  if (userRoles.includes('admin')) return true;

  const { data: category } = await supabaseAdmin
    .from('forum_categories')
    .select('allowed_roles, is_active')
    .eq('id', categoryId)
    .single();

  if (!category || !category.is_active) return false;

  const allowedRoles = category.allowed_roles || ['public'];
  return allowedRoles.some((role: string) => userRoles.includes(role));
}

export function registerForumRoutes(app: Express, deps: RouteDeps): void {

  // GET /api/forum/categories - List categories filtered by user's roles
  app.get("/api/forum/categories", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const user = await requireUser(token);
      const userRoles = await getUserRoles(user.userId);

      const { data: categories, error } = await supabaseAdmin
        .from('forum_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw new HttpError(500, error.message);

      // Admins see everything, others are filtered by role
      const isAdmin = userRoles.includes('admin');
      const filteredCategories = isAdmin 
        ? (categories || [])
        : (categories || []).filter(cat => {
            const allowedRoles = cat.allowed_roles || ['public'];
            return allowedRoles.some((role: string) => userRoles.includes(role));
          });

      return res.json(filteredCategories);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/forum/threads - List all threads (with optional category filter)
  app.get("/api/forum/threads", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const user = await requireUser(token);
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const offset = (page - 1) * limit;
      const categorySlug = req.query.category as string | undefined;

      // Fetch user roles and categories in parallel
      const [userRoles, categoriesResult] = await Promise.all([
        getUserRoles(user.userId),
        supabaseAdmin
          .from('forum_categories')
          .select('id, slug, allowed_roles, is_active')
          .eq('is_active', true)
      ]);
      
      const isAdmin = userRoles.includes('admin');
      const allCategories = categoriesResult.data || [];

      let categoryId: string | null = null;
      if (categorySlug && categorySlug !== 'all') {
        const category = allCategories.find(c => c.slug === categorySlug);
        if (!category) {
          throw new HttpError(404, "Category not found");
        }

        if (!isAdmin) {
          const allowedRoles = category.allowed_roles || ['public'];
          if (!allowedRoles.some((role: string) => userRoles.includes(role))) {
            throw new HttpError(403, "Access denied to this category");
          }
        }
        categoryId = category.id;
      }

      const accessibleCategoryIds = isAdmin
        ? allCategories.map(cat => cat.id)
        : allCategories
            .filter(cat => {
              const allowedRoles = cat.allowed_roles || ['public'];
              return allowedRoles.some((role: string) => userRoles.includes(role));
            })
            .map(cat => cat.id);

      let query = supabaseAdmin
        .from('forum_threads')
        .select(`
          *,
          author:users!forum_threads_author_id_fkey(id, full_name, avatar_url),
          category:forum_categories!forum_threads_category_id_fkey(id, name, slug, allowed_roles)
        `, { count: 'exact' })
        .eq('is_deleted', false)
        .in('category_id', accessibleCategoryIds);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data: threads, error, count } = await query
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw new HttpError(500, error.message);

      return res.json({
        threads: threads || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/forum/categories/:slug/threads - List threads in a category
  app.get("/api/forum/categories/:slug/threads", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const user = await requireUser(token);
      const { slug } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const offset = (page - 1) * limit;

      const { data: category, error: catError } = await supabaseAdmin
        .from('forum_categories')
        .select('id, allowed_roles, is_active')
        .eq('slug', slug)
        .single();

      if (catError || !category) {
        throw new HttpError(404, "Category not found");
      }

      const userRoles = await getUserRoles(user.userId);
      const isAdmin = userRoles.includes('admin');
      
      // Admins can access all categories
      if (!isAdmin) {
        const allowedRoles = category.allowed_roles || ['public'];
        if (!allowedRoles.some((role: string) => userRoles.includes(role))) {
          throw new HttpError(403, "Access denied to this category");
        }
      }

      const { data: threads, error, count } = await supabaseAdmin
        .from('forum_threads')
        .select(`
          *,
          author:users!forum_threads_author_id_fkey(id, full_name, avatar_url),
          category:forum_categories!forum_threads_category_id_fkey(id, name, slug)
        `, { count: 'exact' })
        .eq('category_id', category.id)
        .eq('is_deleted', false)
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw new HttpError(500, error.message);

      return res.json({
        threads: threads || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/forum/threads/:slug - Get thread detail with posts
  app.get("/api/forum/threads/:slug", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const user = await requireUser(token);
      const { slug } = req.params;

      // Fetch thread and user roles in parallel
      const [threadResult, userRoles] = await Promise.all([
        supabaseAdmin
          .from('forum_threads')
          .select(`
            *,
            author:users!forum_threads_author_id_fkey(id, full_name, avatar_url),
            category:forum_categories!forum_threads_category_id_fkey(id, name, slug, allowed_roles, is_read_only)
          `)
          .eq('slug', slug)
          .eq('is_deleted', false)
          .single(),
        getUserRoles(user.userId)
      ]);

      if (threadResult.error || !threadResult.data) {
        throw new HttpError(404, "Thread not found");
      }
      
      const thread = threadResult.data;
      const isAdmin = userRoles.includes('admin');
      
      // Admins can access all threads, others need role match
      if (!isAdmin) {
        const allowedRoles = thread.category?.allowed_roles || ['public'];
        if (!allowedRoles.some((role: string) => userRoles.includes(role))) {
          throw new HttpError(403, "Access denied to this thread");
        }
      }

      // Fetch posts
      const { data: posts, error: postsError } = await supabaseAdmin
        .from('forum_posts')
        .select(`
          *,
          author:users!forum_posts_author_id_fkey(id, full_name, avatar_url)
        `)
        .eq('thread_id', thread.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (postsError) throw new HttpError(500, postsError.message);

      // Fetch attachments (gracefully handle if column doesn't exist yet)
      let attachments: any[] = [];
      const { data: attachmentData, error: attachmentError } = await supabaseAdmin
        .from('media_links')
        .select(`
          id,
          category,
          description,
          position,
          is_cover,
          media_file:media_files!media_links_media_file_id_fkey(
            id,
            file_name,
            file_url,
            file_type,
            file_size,
            bucket,
            file_path
          )
        `)
        .eq('forum_thread_id', thread.id)
        .order('position', { ascending: true });
      
      if (!attachmentError && attachmentData) {
        attachments = attachmentData;
      }

      return res.json({
        ...thread,
        posts: posts || [],
        attachments
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // POST /api/forum/threads - Create new thread
  app.post("/api/forum/threads", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const user = await requireUser(token);
      const { category_id, title, content } = req.body;

      if (!category_id || !title || !content) {
        throw new HttpError(400, "Missing required fields: category_id, title, content");
      }

      const hasAccess = await canAccessCategory(user.userId, category_id);
      if (!hasAccess) {
        throw new HttpError(403, "No access to this category");
      }

      const { data: category } = await supabaseAdmin
        .from('forum_categories')
        .select('is_read_only')
        .eq('id', category_id)
        .single();

      if (category?.is_read_only) {
        throw new HttpError(403, "This category is read-only");
      }

      const organizationId = await getUserOrgId(user.userId);
      if (!organizationId) {
        throw new HttpError(400, "User must have an active organization");
      }

      const slug = `${slugify(title)}-${nanoid(8)}`;

      const { data: thread, error } = await supabaseAdmin
        .from('forum_threads')
        .insert({
          category_id,
          organization_id: organizationId,
          author_id: user.userId,
          title,
          slug,
          content: typeof content === 'string' ? { text: content } : content
        })
        .select(`
          *,
          author:users!forum_threads_author_id_fkey(id, full_name, avatar_url)
        `)
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

  // PATCH /api/forum/threads/:id - Update thread (author only)
  app.patch("/api/forum/threads/:id", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const user = await requireUser(token);
      const { id } = req.params;
      const { title, content } = req.body;

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('forum_threads')
        .select('author_id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        throw new HttpError(404, "Thread not found");
      }

      if (existing.author_id !== user.userId) {
        throw new HttpError(403, "Only the author can edit this thread");
      }

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (title) updateData.title = title;
      if (content) updateData.content = typeof content === 'string' ? { text: content } : content;

      const { data: thread, error } = await supabaseAdmin
        .from('forum_threads')
        .update(updateData)
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

  // DELETE /api/forum/threads/:id - Soft delete thread (author or admin only)
  app.delete("/api/forum/threads/:id", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const user = await requireUser(token);
      const { id } = req.params;
      const userRoles = await getUserRoles(user.userId);
      const isAdmin = userRoles.includes('admin');

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('forum_threads')
        .select('author_id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        throw new HttpError(404, "Thread not found");
      }

      // Only author or admin can delete
      if (existing.author_id !== user.userId && !isAdmin) {
        throw new HttpError(403, "Only the author or admin can delete this thread");
      }

      const { error } = await supabaseAdmin
        .from('forum_threads')
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

  // POST /api/forum/threads/:id/view - Increment view count
  app.post("/api/forum/threads/:id/view", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data: thread } = await supabaseAdmin
        .from('forum_threads')
        .select('view_count')
        .eq('id', id)
        .single();

      if (thread) {
        await supabaseAdmin
          .from('forum_threads')
          .update({ view_count: (thread.view_count || 0) + 1 })
          .eq('id', id);
      }

      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // POST /api/forum/posts - Create new post/reply
  app.post("/api/forum/posts", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const user = await requireUser(token);
      const { thread_id, content, parent_id } = req.body;

      if (!thread_id || !content) {
        throw new HttpError(400, "Missing required fields: thread_id, content");
      }

      const { data: thread, error: threadError } = await supabaseAdmin
        .from('forum_threads')
        .select(`
          id, is_locked, category_id,
          category:forum_categories!forum_threads_category_id_fkey(id, is_read_only, allowed_roles)
        `)
        .eq('id', thread_id)
        .eq('is_deleted', false)
        .single();

      if (threadError || !thread) {
        throw new HttpError(404, "Thread not found");
      }

      if (thread.is_locked) {
        throw new HttpError(403, "Thread is locked");
      }

      const threadCategory = Array.isArray(thread.category) ? thread.category[0] : thread.category;
      if (threadCategory?.is_read_only) {
        throw new HttpError(403, "Category is read-only");
      }

      const hasAccess = await canAccessCategory(user.userId, thread.category_id);
      if (!hasAccess) {
        throw new HttpError(403, "No access to this thread's category");
      }

      const organizationId = await getUserOrgId(user.userId);
      if (!organizationId) {
        throw new HttpError(400, "User must have an active organization");
      }

      const { data: post, error } = await supabaseAdmin
        .from('forum_posts')
        .insert({
          thread_id,
          organization_id: organizationId,
          author_id: user.userId,
          parent_id: parent_id || null,
          content: typeof content === 'string' ? { text: content } : content
        })
        .select(`
          *,
          author:users!forum_posts_author_id_fkey(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw new HttpError(400, error.message);

      return res.status(201).json(post);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/forum/posts/:id - Update post (author only)
  app.patch("/api/forum/posts/:id", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const user = await requireUser(token);
      const { id } = req.params;
      const { content } = req.body;

      if (!content) {
        throw new HttpError(400, "Content is required");
      }

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('forum_posts')
        .select('author_id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        throw new HttpError(404, "Post not found");
      }

      if (existing.author_id !== user.userId) {
        throw new HttpError(403, "Only the author can edit this post");
      }

      const { data: post, error } = await supabaseAdmin
        .from('forum_posts')
        .update({
          content: typeof content === 'string' ? { text: content } : content,
          updated_at: new Date().toISOString()
        })
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

  // DELETE /api/forum/posts/:id - Soft delete post
  app.delete("/api/forum/posts/:id", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const user = await requireUser(token);
      const { id } = req.params;

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('forum_posts')
        .select('author_id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        throw new HttpError(404, "Post not found");
      }

      if (existing.author_id !== user.userId) {
        throw new HttpError(403, "Only the author can delete this post");
      }

      const { error } = await supabaseAdmin
        .from('forum_posts')
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

  // POST /api/forum/reactions - Toggle reaction (like/unlike)
  app.post("/api/forum/reactions", async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      const user = await requireUser(token);
      const { item_type, item_id, reaction_type = 'like' } = req.body;

      if (!item_type || !item_id) {
        throw new HttpError(400, "Missing required fields: item_type, item_id");
      }

      if (!['thread', 'post'].includes(item_type)) {
        throw new HttpError(400, "item_type must be 'thread' or 'post'");
      }

      const { data: existing, error: checkError } = await supabaseAdmin
        .from('forum_reactions')
        .select('id')
        .eq('user_id', user.userId)
        .eq('item_type', item_type)
        .eq('item_id', item_id)
        .maybeSingle();

      if (checkError) throw new HttpError(500, checkError.message);

      if (existing) {
        const { error: deleteError } = await supabaseAdmin
          .from('forum_reactions')
          .delete()
          .eq('id', existing.id);

        if (deleteError) throw new HttpError(400, deleteError.message);

        return res.json({ action: 'removed', reaction: null });
      } else {
        const { data: reaction, error: insertError } = await supabaseAdmin
          .from('forum_reactions')
          .insert({
            user_id: user.userId,
            item_type,
            item_id,
            reaction_type
          })
          .select()
          .single();

        if (insertError) throw new HttpError(400, insertError.message);

        return res.status(201).json({ action: 'added', reaction });
      }
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/forum/threads/:id/reactions - Get reactions count
  app.get("/api/forum/threads/:id/reactions", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const token = extractToken(req.headers.authorization);
      let currentUserReaction = null;

      const { data: threadReactions, error: threadError } = await supabaseAdmin
        .from('forum_reactions')
        .select('reaction_type')
        .eq('item_type', 'thread')
        .eq('item_id', id);

      if (threadError) throw new HttpError(500, threadError.message);

      const { data: posts } = await supabaseAdmin
        .from('forum_posts')
        .select('id')
        .eq('thread_id', id)
        .eq('is_deleted', false);

      const postIds = (posts || []).map(p => p.id);

      let postReactions: any[] = [];
      if (postIds.length > 0) {
        const { data, error: postError } = await supabaseAdmin
          .from('forum_reactions')
          .select('item_id, reaction_type')
          .eq('item_type', 'post')
          .in('item_id', postIds);

        if (postError) throw new HttpError(500, postError.message);
        postReactions = data || [];
      }

      if (token) {
        try {
          const user = await requireUser(token);
          const { data: userReaction } = await supabaseAdmin
            .from('forum_reactions')
            .select('reaction_type')
            .eq('user_id', user.userId)
            .eq('item_type', 'thread')
            .eq('item_id', id)
            .maybeSingle();

          currentUserReaction = userReaction?.reaction_type || null;
        } catch (e) {}
      }

      const threadLikes = (threadReactions || []).filter(r => r.reaction_type === 'like').length;

      const postReactionsByPost = postIds.reduce((acc, postId) => {
        acc[postId] = (postReactions || []).filter(r => r.item_id === postId && r.reaction_type === 'like').length;
        return acc;
      }, {} as Record<string, number>);

      return res.json({
        thread: {
          likes: threadLikes,
          userReaction: currentUserReaction
        },
        posts: postReactionsByPost
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // POST /api/forum/categories - Create new category (admin only)
  app.post("/api/forum/categories", async (req: Request, res: Response) => {
    try {
      const user = await verifyAdminUser(req.headers.authorization);

      const { 
        name, 
        description, 
        icon = 'MessageSquare', 
        color = '#3b82f6', 
        allowed_roles = ['public'], 
        sort_order 
      } = req.body;

      if (!name) {
        throw new HttpError(400, "Name is required");
      }

      const slug = slugify(name);

      let finalSortOrder = sort_order;
      if (finalSortOrder === undefined) {
        const { data: lastCategory } = await supabaseAdmin
          .from('forum_categories')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1)
          .maybeSingle();
        finalSortOrder = (lastCategory?.sort_order || 0) + 1;
      }

      const { data: category, error } = await supabaseAdmin
        .from('forum_categories')
        .insert([{
          name,
          slug,
          description: description || null,
          icon,
          color,
          allowed_roles,
          sort_order: finalSortOrder,
          is_active: true,
          is_read_only: false,
        }])
        .select()
        .single();

      if (error) throw new HttpError(400, error.message);

      return res.status(201).json(category);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Forum category error:', error);
      return res.status(500).json({ error: error.message || "Internal error" });
    }
  });

  // PATCH /api/forum/categories/:id - Update category (admin only)
  app.patch("/api/forum/categories/:id", async (req: Request, res: Response) => {
    try {
      await verifyAdminUser(req.headers.authorization);
      const { id } = req.params;
      const { name, description, icon, color, allowed_roles, sort_order } = req.body;

      const updateData: Record<string, any> = {};
      if (name !== undefined) {
        updateData.name = name;
        updateData.slug = slugify(name);
      }
      if (description !== undefined) updateData.description = description;
      if (icon !== undefined) updateData.icon = icon;
      if (color !== undefined) updateData.color = color;
      if (allowed_roles !== undefined) updateData.allowed_roles = allowed_roles;
      if (sort_order !== undefined) updateData.sort_order = sort_order;

      const { data: category, error } = await supabaseAdmin
        .from('forum_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new HttpError(400, error.message);

      return res.json(category);
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/forum/categories/:id - Delete category (admin only)
  app.delete("/api/forum/categories/:id", async (req: Request, res: Response) => {
    try {
      await verifyAdminUser(req.headers.authorization);
      const { id } = req.params;

      // Soft delete - set is_active to false
      const { error } = await supabaseAdmin
        .from('forum_categories')
        .update({ is_active: false })
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
}

export default registerForumRoutes;
