export function encodeCustomData(data: any): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export type DecodedExternalReference = {
  user_id?: string | null;
  course_slug?: string | null;
  months?: number | null;
  product_type?: string | null;
  plan_slug?: string | null;
  organization_id?: string | null;
  billing_period?: 'monthly' | 'annual' | null;
  coupon_code?: string | null;
  coupon_id?: string | null;
};

export function decodeExternalReference(ext?: string | null): DecodedExternalReference {
  if (!ext) return {};
  
  try {
    const decoded = Buffer.from(ext, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    
    if (typeof parsed === 'object' && parsed !== null) {
      console.log('[MP encoding] ✅ Decoded base64 JSON:', parsed);
      return {
        user_id: parsed.user_id || null,
        course_slug: parsed.course_slug || null,
        months: parsed.months || null,
        product_type: parsed.product_type || null,
        plan_slug: parsed.plan_slug || null,
        organization_id: parsed.organization_id || null,
        billing_period: parsed.billing_period || null,
        coupon_code: parsed.coupon_code || null,
        coupon_id: parsed.coupon_id || null,
      };
    }
  } catch (e) {
  }
  
  const [u, s, m] = String(ext).split("|");
  return {
    user_id: u || null,
    course_slug: s || null,
    months: m === "null" ? null : Number.isFinite(Number(m)) ? Number(m) : null,
  };
}

export function extractMetadata(obj: any): {
  user_id?: string | null;
  course_slug?: string | null;
  months?: number | null;
  external_reference?: string | null;
  product_type?: string | null;
  organization_id?: string | null;
  plan_id?: string | null;
  plan_slug?: string | null;
  billing_period?: 'monthly' | 'annual' | null;
  coupon_code?: string | null;
  coupon_id?: string | null;
} {
  const md = obj?.metadata || obj?.additional_info || {};
  const months =
    md?.months != null
      ? Number(md.months)
      : obj?.months != null
        ? Number(obj.months)
        : null;

  const user_id =
    md?.user_id || obj?.user_id || obj?.payer?.id || obj?.client_id || null;

  const course_slug =
    md?.course_slug || obj?.course_slug || obj?.items?.[0]?.category_id || null;

  const external_reference =
    obj?.external_reference || md?.external_reference || null;

  const product_type = md?.product_type || null;
  const organization_id = md?.organization_id || null;
  const plan_id = md?.plan_id || null;
  const plan_slug = md?.plan_slug || null;
  const billing_period = md?.billing_period || null;
  const coupon_code = md?.coupon_code || null;
  const coupon_id = md?.coupon_id || null;

  return {
    user_id: user_id ? String(user_id) : null,
    course_slug: course_slug ? String(course_slug) : null,
    months: months && !Number.isNaN(months) ? months : null,
    external_reference: external_reference ? String(external_reference) : null,
    product_type: product_type ? String(product_type) : null,
    organization_id: organization_id ? String(organization_id) : null,
    plan_id: plan_id ? String(plan_id) : null,
    plan_slug: plan_slug ? String(plan_slug) : null,
    billing_period: billing_period === 'monthly' || billing_period === 'annual' ? billing_period : null,
    coupon_code: coupon_code ? String(coupon_code) : null,
    coupon_id: coupon_id ? String(coupon_id) : null,
  };
}
