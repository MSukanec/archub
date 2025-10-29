// api/admin/dashboard.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminUser, AuthError } from "./auth-helper";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization || "";

    try {
      await verifyAdminUser(authHeader);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Auth error:", error);
      return res.status(500).json({ error: "Internal error" });
    }

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res
        .status(500)
        .json({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    if (req.method === "GET") {
      // GET /api/admin/dashboard - Get dashboard statistics
      
      // Calculate date ranges
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, is_active');

      console.log('📚 Courses query:', { courses, coursesError });

      const totalCourses = courses?.length || 0;
      const activeCourses = courses?.filter(c => c.is_active).length || 0;

      // Fetch enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('id, status, expires_at, started_at');

      console.log('👥 Enrollments query:', { enrollments, enrollmentsError });

      const totalEnrollments = enrollments?.length || 0;
      const activeEnrollments = enrollments?.filter(e => 
        e.status === 'active' && 
        (!e.expires_at || new Date(e.expires_at) > now)
      ).length || 0;

      const expiringThisMonth = enrollments?.filter(e => {
        if (!e.expires_at) return false;
        const expDate = new Date(e.expires_at);
        return expDate > now && expDate <= thisMonthEnd;
      }).length || 0;

      const expiringNextMonth = enrollments?.filter(e => {
        if (!e.expires_at) return false;
        const expDate = new Date(e.expires_at);
        return expDate > thisMonthEnd && expDate <= nextMonthEnd;
      }).length || 0;

      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, currency, created_at, status')
        .eq('status', 'completed');

      console.log('💰 Payments query:', { payments, paymentsError, count: payments?.length || 0 });

      const totalRevenue = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

      const revenueThisMonth = payments?.filter(p => {
        const date = new Date(p.created_at);
        return date >= thisMonthStart && date <= thisMonthEnd;
      }).reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

      const revenueLastMonth = payments?.filter(p => {
        const date = new Date(p.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      }).reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

      // Fetch progress
      const { data: progress } = await supabase
        .from('course_lesson_progress')
        .select('progress_pct');

      const avgCompletionRate = progress?.length 
        ? progress.reduce((sum, p) => sum + (Number(p.progress_pct) || 0), 0) / progress.length
        : 0;

      // Fetch recent enrollments
      const { data: recentEnrollments } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          started_at,
          expires_at,
          status,
          users!inner(full_name, email),
          courses!inner(title)
        `)
        .order('started_at', { ascending: false })
        .limit(10);

      // Fetch expiring soon
      const { data: expiringSoon } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          started_at,
          expires_at,
          status,
          users!inner(full_name, email),
          courses!inner(title)
        `)
        .not('expires_at', 'is', null)
        .order('expires_at', { ascending: true })
        .limit(10);

      const responseData = {
        stats: {
          totalCourses,
          activeCourses,
          totalEnrollments,
          activeEnrollments,
          expiringThisMonth,
          expiringNextMonth,
          totalRevenue,
          revenueThisMonth,
          revenueLastMonth,
          avgCompletionRate
        },
        recentEnrollments: recentEnrollments || [],
        expiringSoon: (expiringSoon || []).filter(e => {
          const expDate = new Date(e.expires_at!);
          const daysUntilExpiry = Math.floor((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
        })
      };

      console.log('📊 Dashboard response:', JSON.stringify(responseData, null, 2));

      // Prevent caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.status(200).json(responseData);

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
