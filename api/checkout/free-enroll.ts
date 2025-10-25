import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { courseSlug, code } = req.body;
    const authHeader = req.headers.authorization || '';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.substring(7);

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!url || !serviceKey || !anonKey) {
      return res.status(500).json({ error: "Missing environment variables" });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const authenticatedSupabase = createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
    
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid authentication" });
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return res.status(404).json({ error: "User profile not found" });
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, slug, title')
      .eq('slug', courseSlug)
      .single();

    if (courseError || !course) {
      console.error('Error fetching course:', courseError);
      return res.status(404).json({ error: "Course not found" });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "Coupon code required for free enrollment" });
    }

    const { data: priceData } = await supabase
      .from('course_prices')
      .select('amount, currency_code')
      .eq('course_id', course.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const coursePrice = priceData?.amount || 0;

    const { data: validationResult, error: couponError } = await authenticatedSupabase.rpc('validate_coupon', {
      p_code: code.trim(),
      p_course_id: course.id,
      p_price: coursePrice,
      p_currency: priceData?.currency_code || 'ARS'
    });

    if (couponError || !validationResult || !validationResult.ok) {
      console.error('Coupon validation failed:', couponError || validationResult);
      return res.status(400).json({ error: "Invalid coupon" });
    }

    if (validationResult.final_price !== 0) {
      return res.status(400).json({ 
        error: "This coupon does not provide 100% discount. Please use the normal payment flow." 
      });
    }

    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', profile.id)
      .eq('course_id', course.id)
      .maybeSingle();

    if (existingEnrollment) {
      return res.status(400).json({ error: "You are already enrolled in this course" });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);

    const { error: enrollmentError } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: profile.id,
        course_id: course.id,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_method: 'coupon_100',
        amount_paid: 0,
        currency: priceData?.currency_code || 'ARS'
      });

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError);
      return res.status(500).json({ error: "Failed to create enrollment" });
    }

    if (validationResult.coupon_id) {
      await supabase
        .from('coupon_redemptions')
        .insert({
          coupon_id: validationResult.coupon_id,
          user_id: profile.id,
          course_id: course.id,
          original_price: coursePrice,
          discount_amount: validationResult.discount,
          final_price: 0
        });
    }

    console.log('✅ Free enrollment created:', {
      userId: profile.id,
      courseId: course.id,
      couponCode: code
    });

    return res.status(200).json({ 
      success: true,
      message: 'Enrollment created successfully',
      courseSlug: course.slug
    });

  } catch (error: any) {
    console.error('Error creating free enrollment:', error);
    return res.status(500).json({ 
      error: "Failed to create enrollment",
      message: error.message 
    });
  }
}
