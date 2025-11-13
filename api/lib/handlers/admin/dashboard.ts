// api/lib/handlers/admin/dashboard.ts
// Admin dashboard statistics handler

import type { AdminContext, AdminHandlerResult } from "./types.js";
import { success, error } from "./types.js";

/**
 * Get admin dashboard statistics
 * Includes course stats, enrollment stats, revenue, and recent/expiring enrollments
 */
export async function getDashboardStats(
  ctx: AdminContext
): Promise<AdminHandlerResult> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Execute all queries in parallel
    const [
      allCoursesResult,
      activeCoursesResult,
      allEnrollmentsResult,
      activeEnrollmentsResult,
      expiringThisMonthResult,
      expiringNextMonthResult,
      allPaymentsResult,
      recentEnrollmentsResult,
      expiringSoonResult,
      allProgressResult
    ] = await Promise.all([
      // Total courses
      ctx.supabase.from('courses').select('id', { count: 'exact', head: true }),
      
      // Active courses
      ctx.supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
      
      // Total enrollments
      ctx.supabase.from('course_enrollments').select('id', { count: 'exact', head: true }),
      
      // Active enrollments
      ctx.supabase.from('course_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      
      // Expiring this month
      ctx.supabase.from('course_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .not('expires_at', 'is', null)
        .gte('expires_at', startOfMonth.toISOString())
        .lte('expires_at', endOfMonth.toISOString()),
      
      // Expiring next month
      ctx.supabase.from('course_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .not('expires_at', 'is', null)
        .gte('expires_at', startOfNextMonth.toISOString())
        .lte('expires_at', endOfNextMonth.toISOString()),
      
      // All payments for revenue calculations
      ctx.supabase.from('payments').select('*'),
      
      // Recent enrollments (last 10)
      ctx.supabase.from('course_enrollments')
        .select('*, users(full_name, email), courses(title, slug)')
        .order('started_at', { ascending: false })
        .limit(10),
      
      // Expiring in next 30 days
      ctx.supabase.from('course_enrollments')
        .select('*, users(full_name, email), courses(title, slug)')
        .eq('status', 'active')
        .not('expires_at', 'is', null)
        .gte('expires_at', now.toISOString())
        .lte('expires_at', next30Days.toISOString())
        .order('expires_at', { ascending: true })
        .limit(10),
      
      // All lesson progress for avg completion rate
      ctx.supabase.from('course_lesson_progress')
        .select('progress_pct')
    ]);
    
    // Calculate average completion rate
    const progressData = allProgressResult.data || [];
    const avgCompletionRate = progressData.length > 0
      ? progressData.reduce((sum, p) => sum + (p.progress_pct || 0), 0) / progressData.length
      : 0;
    
    // Calculate revenue from payments
    const payments = allPaymentsResult.data || [];
    const completedPayments = payments.filter(p => p.status === 'completed');
    
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    const revenueThisMonth = completedPayments
      .filter(p => {
        const date = new Date(p.created_at);
        return date >= startOfMonth && date <= endOfMonth;
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    const revenueLastMonth = completedPayments
      .filter(p => {
        const date = new Date(p.created_at);
        return date >= startOfLastMonth && date <= endOfLastMonth;
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    // Build stats object
    const stats = {
      totalCourses: allCoursesResult.count || 0,
      activeCourses: activeCoursesResult.count || 0,
      totalEnrollments: allEnrollmentsResult.count || 0,
      activeEnrollments: activeEnrollmentsResult.count || 0,
      expiringThisMonth: expiringThisMonthResult.count || 0,
      expiringNextMonth: expiringNextMonthResult.count || 0,
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      avgCompletionRate
    };
    
    return success({
      stats,
      recentEnrollments: recentEnrollmentsResult.data || [],
      expiringSoon: expiringSoonResult.data || []
    });
  } catch (err: any) {
    console.error('getDashboardStats error:', err);
    return error(err.message || "Internal error");
  }
}
