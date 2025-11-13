// api/_lib/handlers/admin/coupons.ts
// Admin coupon management handlers

import type { AdminContext, AdminHandlerResult } from "./types.js";
import { success, error } from "./types.js";

/**
 * Create new coupon with course associations
 */
export async function createCoupon(
  ctx: AdminContext,
  data: any
): Promise<AdminHandlerResult> {
  try {
    const { couponData, selectedCourses } = data;
    
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
        applies_to_all: selectedCourses?.length === 0,
      })
      .select()
      .single();
    
    if (couponError) {
      console.error('Error creating coupon:', couponError);
      return error("Failed to create coupon");
    }
    
    // Create course associations if any
    if (selectedCourses && selectedCourses.length > 0) {
      const associations = selectedCourses.map((courseId: string) => ({
        coupon_id: newCoupon.id,
        course_id: courseId
      }));
      
      const { error: assocError } = await ctx.supabase
        .from('coupon_courses')
        .insert(associations);
      
      if (assocError) {
        console.error('Error creating coupon associations:', assocError);
      }
    }
    
    return success(newCoupon);
  } catch (err: any) {
    console.error('createCoupon error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Update coupon and its course associations
 */
export async function updateCoupon(
  ctx: AdminContext,
  params: { id: string },
  data: any
): Promise<AdminHandlerResult> {
  try {
    const { couponData, selectedCourses } = data;
    
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
        applies_to_all: selectedCourses?.length === 0,
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating coupon:', updateError);
      return error("Failed to update coupon");
    }
    
    // Update course associations
    // First, delete all existing associations
    await ctx.supabase
      .from('coupon_courses')
      .delete()
      .eq('coupon_id', params.id);
    
    // Then create new associations if any
    if (selectedCourses && selectedCourses.length > 0) {
      const associations = selectedCourses.map((courseId: string) => ({
        coupon_id: params.id,
        course_id: courseId
      }));
      
      const { error: assocError } = await ctx.supabase
        .from('coupon_courses')
        .insert(associations);
      
      if (assocError) {
        console.error('Error updating coupon associations:', assocError);
      }
    }
    
    return success(updatedCoupon);
  } catch (err: any) {
    console.error('updateCoupon error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Delete coupon and its course associations
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
