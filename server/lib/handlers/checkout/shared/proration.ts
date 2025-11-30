import { SupabaseClient } from "@supabase/supabase-js";

export interface ProrationResult {
  hasActiveSubscription: boolean;
  currentPlan: {
    id: string;
    name: string;
    slug: string;
  } | null;
  currentSubscription: {
    id: string;
    started_at: string;
    expires_at: string;
    billing_period: string;
    amount: number;
    currency: string;
  } | null;
  credit: {
    daysRemaining: number;
    totalDays: number;
    percentageRemaining: number;
    creditAmount: number;
    creditCurrency: string;
  } | null;
  targetPlan: {
    id: string;
    name: string;
    slug: string;
    priceUSD: number;
    priceARS: number;
  };
  finalPrice: {
    usd: number;
    ars: number;
  };
  savings: {
    usd: number;
    ars: number;
  };
}

export interface CalculateProrationParams {
  organizationId: string;
  targetPlanSlug: string;
  billingPeriod: 'monthly' | 'annual';
}

export async function calculateProration(
  supabase: SupabaseClient,
  params: CalculateProrationParams
): Promise<ProrationResult> {
  const { organizationId, targetPlanSlug, billingPeriod } = params;

  const { data: targetPlan, error: targetPlanError } = await supabase
    .from('plans')
    .select('id, name, slug, monthly_amount, annual_amount')
    .eq('slug', targetPlanSlug)
    .single();

  if (targetPlanError || !targetPlan) {
    throw new Error(`Plan not found: ${targetPlanSlug}`);
  }

  const targetPriceUSD = billingPeriod === 'annual' 
    ? parseFloat(targetPlan.annual_amount) 
    : parseFloat(targetPlan.monthly_amount);

  const { data: exchangeRate } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('from_currency', 'USD')
    .eq('to_currency', 'ARS')
    .eq('is_active', true)
    .single();

  const arsRate = exchangeRate ? parseFloat(exchangeRate.rate) : 1200;
  const targetPriceARS = targetPriceUSD * arsRate;

  const { data: activeSubscription, error: subError } = await supabase
    .from('organization_subscriptions')
    .select(`
      id,
      plan_id,
      started_at,
      expires_at,
      billing_period,
      amount,
      currency
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError) {
    console.error('[proration] Error fetching subscription:', subError);
  }

  if (!activeSubscription) {
    return {
      hasActiveSubscription: false,
      currentPlan: null,
      currentSubscription: null,
      credit: null,
      targetPlan: {
        id: targetPlan.id,
        name: targetPlan.name,
        slug: targetPlan.slug,
        priceUSD: targetPriceUSD,
        priceARS: targetPriceARS,
      },
      finalPrice: {
        usd: targetPriceUSD,
        ars: targetPriceARS,
      },
      savings: {
        usd: 0,
        ars: 0,
      },
    };
  }

  const { data: currentPlan } = await supabase
    .from('plans')
    .select('id, name, slug, monthly_amount, annual_amount')
    .eq('id', activeSubscription.plan_id)
    .single();

  if (!currentPlan || currentPlan.slug === 'free') {
    return {
      hasActiveSubscription: true,
      currentPlan: currentPlan ? {
        id: currentPlan.id,
        name: currentPlan.name,
        slug: currentPlan.slug,
      } : null,
      currentSubscription: {
        id: activeSubscription.id,
        started_at: activeSubscription.started_at,
        expires_at: activeSubscription.expires_at,
        billing_period: activeSubscription.billing_period,
        amount: parseFloat(activeSubscription.amount),
        currency: activeSubscription.currency,
      },
      credit: null,
      targetPlan: {
        id: targetPlan.id,
        name: targetPlan.name,
        slug: targetPlan.slug,
        priceUSD: targetPriceUSD,
        priceARS: targetPriceARS,
      },
      finalPrice: {
        usd: targetPriceUSD,
        ars: targetPriceARS,
      },
      savings: {
        usd: 0,
        ars: 0,
      },
    };
  }

  const now = new Date();
  const startedAt = new Date(activeSubscription.started_at);
  const expiresAt = new Date(activeSubscription.expires_at);

  const totalDays = Math.ceil((expiresAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  if (daysRemaining <= 0) {
    return {
      hasActiveSubscription: true,
      currentPlan: {
        id: currentPlan.id,
        name: currentPlan.name,
        slug: currentPlan.slug,
      },
      currentSubscription: {
        id: activeSubscription.id,
        started_at: activeSubscription.started_at,
        expires_at: activeSubscription.expires_at,
        billing_period: activeSubscription.billing_period,
        amount: parseFloat(activeSubscription.amount),
        currency: activeSubscription.currency,
      },
      credit: {
        daysRemaining: 0,
        totalDays,
        percentageRemaining: 0,
        creditAmount: 0,
        creditCurrency: activeSubscription.currency,
      },
      targetPlan: {
        id: targetPlan.id,
        name: targetPlan.name,
        slug: targetPlan.slug,
        priceUSD: targetPriceUSD,
        priceARS: targetPriceARS,
      },
      finalPrice: {
        usd: targetPriceUSD,
        ars: targetPriceARS,
      },
      savings: {
        usd: 0,
        ars: 0,
      },
    };
  }

  const percentageRemaining = daysRemaining / totalDays;
  
  let originalAmountUSD: number;
  if (activeSubscription.currency === 'ARS') {
    originalAmountUSD = parseFloat(activeSubscription.amount) / arsRate;
  } else {
    originalAmountUSD = parseFloat(activeSubscription.amount);
  }

  const creditAmountUSD = originalAmountUSD * percentageRemaining;
  const creditAmountARS = creditAmountUSD * arsRate;

  const finalPriceUSD = Math.max(0, targetPriceUSD - creditAmountUSD);
  const finalPriceARS = Math.max(0, targetPriceARS - creditAmountARS);

  return {
    hasActiveSubscription: true,
    currentPlan: {
      id: currentPlan.id,
      name: currentPlan.name,
      slug: currentPlan.slug,
    },
    currentSubscription: {
      id: activeSubscription.id,
      started_at: activeSubscription.started_at,
      expires_at: activeSubscription.expires_at,
      billing_period: activeSubscription.billing_period,
      amount: parseFloat(activeSubscription.amount),
      currency: activeSubscription.currency,
    },
    credit: {
      daysRemaining,
      totalDays,
      percentageRemaining: Math.round(percentageRemaining * 100),
      creditAmount: activeSubscription.currency === 'ARS' ? creditAmountARS : creditAmountUSD,
      creditCurrency: activeSubscription.currency,
    },
    targetPlan: {
      id: targetPlan.id,
      name: targetPlan.name,
      slug: targetPlan.slug,
      priceUSD: targetPriceUSD,
      priceARS: targetPriceARS,
    },
    finalPrice: {
      usd: Math.round(finalPriceUSD * 100) / 100,
      ars: Math.round(finalPriceARS * 100) / 100,
    },
    savings: {
      usd: Math.round(creditAmountUSD * 100) / 100,
      ars: Math.round(creditAmountARS * 100) / 100,
    },
  };
}
