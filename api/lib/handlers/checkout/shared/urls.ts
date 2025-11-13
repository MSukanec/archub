import type { VercelRequest } from "@vercel/node";

export type URLContext = {
  requestOrigin: string;
  returnBase: string;
  webhookBase: string;
};

export function buildURLContext(req: VercelRequest): URLContext {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const requestOrigin = `${protocol}://${host}`;
  const returnBase = requestOrigin;
  const webhookBase = process.env.CHECKOUT_RETURN_URL_BASE || requestOrigin;

  return { requestOrigin, returnBase, webhookBase };
}

export type CourseBackUrls = {
  success: string;
  failure: string;
  pending: string;
};

export function buildCourseBackUrls(
  returnBase: string,
  courseSlug: string,
  provider: "mp" | "paypal"
): CourseBackUrls {
  if (provider === "mp") {
    return {
      success: `${returnBase}/api/checkout/mp/success-handler?course_slug=${courseSlug}`,
      failure: `${returnBase}/learning/courses/${courseSlug}?payment=failed`,
      pending: `${returnBase}/learning/courses/${courseSlug}?payment=pending`,
    };
  } else {
    return {
      success: `${returnBase}/learning/courses/${courseSlug}?payment=success`,
      failure: `${returnBase}/learning/courses/${courseSlug}?payment=failed`,
      pending: `${returnBase}/learning/courses/${courseSlug}?payment=pending`,
    };
  }
}

export function buildSubscriptionBackUrls(returnBase: string): CourseBackUrls {
  return {
    success: `${returnBase}/organization/billing?payment=success`,
    failure: `${returnBase}/organization/billing?payment=failed`,
    pending: `${returnBase}/organization/billing?payment=pending`,
  };
}
