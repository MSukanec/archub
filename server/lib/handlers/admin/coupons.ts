// api/lib/handlers/admin/coupons.ts
// Admin coupon management handlers

import type { AdminContext, AdminHandlerResult } from "./types.js";
import { success, error } from "./types.js";

/**
 * List all coupons with their course associations
 */
export async function listCoupons(
  ctx: AdminContext
): Promise<AdminHandlerResult> {
  try {
    const { data: coupons, error: dbError } = await ctx.supabase
      .from('coupons')
      .select(`
        *,
        coupon_courses (
          course_id,
          courses (
            id,
            title
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching coupons:', dbError);
      return error("Failed to fetch coupons");
    }

    return success(coupons || []);
  } catch (err: any) {
    console.error('listCoupons error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Create new coupon with course and plan associations
 */
export async function createCoupon(
  ctx: AdminContext,
  data: any
): Promise<AdminHandlerResult> {
  try {
    const { couponData, selectedCourses, selectedPlans } = data;
    
    // Determine applies_to_all based on selected items
    const hasSelectedCourses = selectedCourses && selectedCourses.length > 0;
    const hasSelectedPlans = selectedPlans && selectedPlans.length > 0;
    const appliesTo = couponData.applies_to || 'courses';
    
    // applies_to_all should be true only if no specific items are selected
    let appliesToAll = true;
    if (appliesTo === 'courses' && hasSelectedCourses) appliesToAll = false;
    if (appliesTo === 'subscriptions' && hasSelectedPlans) appliesToAll = false;
    if (appliesTo === 'all' && (hasSelectedCourses || hasSelectedPlans)) appliesToAll = false;
    
    // Create coupon using service role (bypasses RLS)
    const { data: newCoupon, error: couponError } = await ctx.supabase
      .from('coupons')
      .insert({
        code: couponData.code.toUpperCase(),
        type: couponData.type,
        amount: couponData.amount,
        is_active: couponData.is_active,
        starts_at: couponData.starts_at || null,
        expires_at: couponData.expires_at || null,
        max_redemptions: couponData.max_redemptions || null,
        per_user_limit: couponData.per_user_limit || 1,
        min_order_total: couponData.min_order_total || null,
        currency: couponData.currency || null,
        applies_to_all: appliesToAll,
        applies_to: appliesTo,
      })
      .select()
      .single();
    
    if (couponError) {
      console.error('Error creating coupon:', couponError);
      return error("Failed to create coupon");
    }
    
    // Create course associations if any (for 'courses' or 'all')
    if ((appliesTo === 'courses' || appliesTo === 'all') && hasSelectedCourses) {
      const courseAssociations = selectedCourses.map((courseId: string) => ({
        coupon_id: newCoupon.id,
        course_id: courseId
      }));
      
      const { error: assocError } = await ctx.supabase
        .from('coupon_courses')
        .insert(courseAssociations);
      
      if (assocError) {
        console.error('Error creating coupon course associations:', assocError);
      }
    }
    
    // Create plan associations if any (for 'subscriptions' or 'all')
    if ((appliesTo === 'subscriptions' || appliesTo === 'all') && hasSelectedPlans) {
      const planAssociations = selectedPlans.map((planId: string) => ({
        coupon_id: newCoupon.id,
        plan_id: planId
      }));
      
      const { error: planAssocError } = await ctx.supabase
        .from('coupon_plans')
        .insert(planAssociations);
      
      if (planAssocError) {
        console.error('Error creating coupon plan associations:', planAssocError);
      }
    }
    
    return success(newCoupon);
  } catch (err: any) {
    console.error('createCoupon error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Update coupon and its course/plan associations
 */
export async function updateCoupon(
  ctx: AdminContext,
  params: { id: string },
  data: any
): Promise<AdminHandlerResult> {
  try {
    const { couponData, selectedCourses, selectedPlans } = data;
    
    // Determine applies_to_all based on selected items
    const hasSelectedCourses = selectedCourses && selectedCourses.length > 0;
    const hasSelectedPlans = selectedPlans && selectedPlans.length > 0;
    const appliesTo = couponData.applies_to || 'courses';
    
    // applies_to_all should be true only if no specific items are selected
    let appliesToAll = true;
    if (appliesTo === 'courses' && hasSelectedCourses) appliesToAll = false;
    if (appliesTo === 'subscriptions' && hasSelectedPlans) appliesToAll = false;
    if (appliesTo === 'all' && (hasSelectedCourses || hasSelectedPlans)) appliesToAll = false;
    
    // Update coupon using service role (bypasses RLS)
    const { data: updatedCoupon, error: updateError } = await ctx.supabase
      .from('coupons')
      .update({
        code: couponData.code.toUpperCase(),
        type: couponData.type,
        amount: couponData.amount,
        is_active: couponData.is_active,
        starts_at: couponData.starts_at || null,
        expires_at: couponData.expires_at || null,
        max_redemptions: couponData.max_redemptions || null,
        per_user_limit: couponData.per_user_limit || 1,
        min_order_total: couponData.min_order_total || null,
        currency: couponData.currency || null,
        applies_to_all: appliesToAll,
        applies_to: appliesTo,
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating coupon:', updateError);
      return error("Failed to update coupon");
    }
    
    // Update course associations
    // First, delete all existing course associations
    await ctx.supabase
      .from('coupon_courses')
      .delete()
      .eq('coupon_id', params.id);
    
    // Create new course associations if any (for 'courses' or 'all')
    if ((appliesTo === 'courses' || appliesTo === 'all') && hasSelectedCourses) {
      const courseAssociations = selectedCourses.map((courseId: string) => ({
        coupon_id: params.id,
        course_id: courseId
      }));
      
      const { error: assocError } = await ctx.supabase
        .from('coupon_courses')
        .insert(courseAssociations);
      
      if (assocError) {
        console.error('Error updating coupon course associations:', assocError);
      }
    }
    
    // Update plan associations
    // First, delete all existing plan associations
    await ctx.supabase
      .from('coupon_plans')
      .delete()
      .eq('coupon_id', params.id);
    
    // Create new plan associations if any (for 'subscriptions' or 'all')
    if ((appliesTo === 'subscriptions' || appliesTo === 'all') && hasSelectedPlans) {
      const planAssociations = selectedPlans.map((planId: string) => ({
        coupon_id: params.id,
        plan_id: planId
      }));
      
      const { error: planAssocError } = await ctx.supabase
        .from('coupon_plans')
        .insert(planAssociations);
      
      if (planAssocError) {
        console.error('Error updating coupon plan associations:', planAssocError);
      }
    }
    
    return success(updatedCoupon);
  } catch (err: any) {
    console.error('updateCoupon error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Delete coupon and its course/plan associations
 */
export async function deleteCoupon(
  ctx: AdminContext,
  params: { id: string }
): Promise<AdminHandlerResult> {
  try {
    // Delete coupon associations first (cascade)
    await ctx.supabase
      .from('coupon_courses')
      .delete()
      .eq('coupon_id', params.id);
    
    // Delete plan associations (cascade)
    await ctx.supabase
      .from('coupon_plans')
      .delete()
      .eq('coupon_id', params.id);
    
    // Delete coupon using service role (bypasses RLS)
    const { error: deleteError } = await ctx.supabase
      .from('coupons')
      .delete()
      .eq('id', params.id);
    
    if (deleteError) {
      console.error('Error deleting coupon:', deleteError);
      return error("Failed to delete coupon");
    }
    
    return success({ success: true });
  } catch (err: any) {
    console.error('deleteCoupon error:', err);
    return error(err.message || "Internal error");
  }
}
