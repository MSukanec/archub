import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  getCoursesFull,
  type GetCoursesFullResult
} from '../../lib/handlers/learning/getCoursesFull.js';
import {
  getDashboard,
  type GetDashboardResult
} from '../../lib/handlers/learning/getDashboard.js';
import {
  getDashboardFast,
  type GetDashboardFastResult
} from '../../lib/handlers/learning/getDashboardFast.js';
import {
  getCourseProgress,
  type GetCourseProgressParams,
  type GetCourseProgressResult
} from '../../lib/handlers/learning/getCourseProgress.js';
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

export async function handleGetCoursesFull(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: LearningHandlerContext = { supabase };

    const result = await getCoursesFull(ctx);

    if (result.success) {
      // Add cache control headers AND ETag to prevent caching
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Surrogate-Control', 'no-store');
      res.set('ETag', `"${Date.now()}"`); // Force fresh response every time
      
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in handleGetCoursesFull controller:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Failed to fetch courses' });
  }
}

export async function handleGetDashboard(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: LearningHandlerContext = { supabase };

    const result = await getDashboard(ctx);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in handleGetDashboard controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
}

export async function handleGetDashboardFast(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: LearningHandlerContext = { supabase };

    const result = await getDashboardFast(ctx);

    if (result.success) {
      // Add aggressive cache control
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Surrogate-Control', 'no-store');
      res.set('ETag', `"${Date.now()}"`); // Force fresh response every time
      
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in handleGetDashboardFast controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
}

export async function handleGetCourseProgress(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: LearningHandlerContext = { supabase };

    const params: GetCourseProgressParams = {
      courseId: req.params.id
    };

    const result = await getCourseProgress(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in handleGetCourseProgress controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch course progress' });
  }
}

export async function handleGetCourseStructure(req: Request, res: Response) {
  try {
    const { id: courseId } = req.params;
    
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Use authenticated client with user's token
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    
    // Get modules for the course
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_index', { ascending: true });

    if (modulesError) {
      console.error('Error fetching course modules:', modulesError);
      throw modulesError;
    }

    if (!modules || modules.length === 0) {
      // Disable HTTP caching for empty responses
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.set('Pragma', 'no-cache');
      return res.status(200).json([]);
    }

    // Get lessons for all modules
    const moduleIds = modules.map((m: any) => m.id);
    
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('*')
      .in('module_id', moduleIds)
      .order('sort_index', { ascending: true });

    if (lessonsError) {
      console.error('Error fetching course lessons:', lessonsError);
    }

    // Combine modules with nested lessons
    const structure = modules.map((module: any) => ({
      ...module,
      lessons: lessons?.filter((lesson: any) => lesson.module_id === module.id) || []
    }));

    // Set response headers to prevent caching issues
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.status(200).json(structure);
  } catch (error: any) {
    console.error('Error in handleGetCourseStructure controller:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch course structure' });
  }
}
