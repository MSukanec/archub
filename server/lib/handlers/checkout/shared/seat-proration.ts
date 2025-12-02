import { SupabaseClient } from "@supabase/supabase-js";

export interface SeatProrationResult {
  canAddSeat: boolean;
  error?: string;
  
  organization: {
    id: string;
    name: string;
    planSlug: string;
    planName: string;
  } | null;
  
  subscription: {
    id: string;
    billingPeriod: 'monthly' | 'annual';
    startedAt: string;
    expiresAt: string;
    currentSeats: number;
    maxSeats: number;
  } | null;
  
  pricing: {
    seatPriceUSD: number;
    seatPriceARS: number;
    daysRemaining: number;
    totalDays: number;
    percentageRemaining: number;
    proratedAmountUSD: number;
    proratedAmountARS: number;
  } | null;
  
  invitation: {
    email: string;
    roleId: string;
    roleName?: string;
  };
}

export interface CalculateSeatProrationParams {
  organizationId: string;
  inviteeEmail: string;
  roleId: string;
}

export async function calculateSeatProration(
  supabase: SupabaseClient,
  params: CalculateSeatProrationParams
): Promise<SeatProrationResult> {
  const { organizationId, inviteeEmail, roleId } = params;

  const baseResult: SeatProrationResult = {
    canAddSeat: false,
    organization: null,
    subscription: null,
    pricing: null,
    invitation: {
      email: inviteeEmail,
      roleId: roleId,
    }
  };

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select(`
      id, 
      name, 
      plan_id,
      plans!left (
        id,
        name,
        slug,
        features,
        monthly_amount,
        annual_amount,
        billing_type
      )
    `)
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    return { ...baseResult, error: 'Organización no encontrada' };
  }

  const plan = (org as any).plans;
  if (!plan) {
    return { ...baseResult, error: 'La organización no tiene un plan asignado' };
  }

  const planSlug = plan.slug?.toLowerCase() || '';
  
  if (planSlug === 'free' || planSlug === 'pro') {
    return { 
      ...baseResult, 
      error: 'Tu plan actual no permite agregar miembros. Actualiza a TEAMS para invitar miembros.',
      organization: {
        id: org.id,
        name: org.name,
        planSlug: plan.slug,
        planName: plan.name,
      }
    };
  }

  const { data: role } = await supabase
    .from('roles')
    .select('id, name')
    .eq('id', roleId)
    .single();

  baseResult.invitation.roleName = role?.name || 'Miembro';

  const { data: subscription, error: subError } = await supabase
    .from('organization_subscriptions')
    .select('id, billing_period, started_at, expires_at, amount, currency')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError || !subscription) {
    return { 
      ...baseResult, 
      error: 'No tienes una suscripción activa. Activa tu plan primero.',
      organization: {
        id: org.id,
        name: org.name,
        planSlug: plan.slug,
        planName: plan.name,
      }
    };
  }

  const { count: activeMembers } = await supabase
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  const { count: pendingInvitations } = await supabase
    .from('organization_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'pending');

  const currentSeats = (activeMembers || 0) + (pendingInvitations || 0);
  const features = plan.features || {};
  const maxSeats: number = features.max_members !== undefined ? features.max_members : 1;
  
  if (maxSeats !== -1 && currentSeats >= maxSeats) {
    return {
      ...baseResult,
      error: `Has alcanzado el límite de ${maxSeats} miembros para tu plan.`,
      organization: {
        id: org.id,
        name: org.name,
        planSlug: plan.slug,
        planName: plan.name,
      },
      subscription: {
        id: subscription.id,
        billingPeriod: subscription.billing_period as 'monthly' | 'annual',
        startedAt: subscription.started_at,
        expiresAt: subscription.expires_at,
        currentSeats,
        maxSeats,
      }
    };
  }

  const { data: exchangeRate } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('from_currency', 'USD')
    .eq('to_currency', 'ARS')
    .eq('is_active', true)
    .single();

  const arsRate = exchangeRate ? parseFloat(exchangeRate.rate) : 1200;

  const isMonthly = subscription.billing_period === 'monthly';
  const seatPriceUSD = parseFloat(isMonthly ? plan.monthly_amount : plan.annual_amount) || 0;
  const seatPriceARS = seatPriceUSD * arsRate;

  const now = new Date();
  const startedAt = new Date(subscription.started_at);
  const expiresAt = new Date(subscription.expires_at);

  const totalDays = Math.ceil((expiresAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const percentageRemaining = totalDays > 0 ? daysRemaining / totalDays : 0;
  
  const proratedAmountUSD = Math.round(seatPriceUSD * percentageRemaining * 100) / 100;
  const proratedAmountARS = Math.round(seatPriceARS * percentageRemaining * 100) / 100;

  return {
    canAddSeat: true,
    organization: {
      id: org.id,
      name: org.name,
      planSlug: plan.slug,
      planName: plan.name,
    },
    subscription: {
      id: subscription.id,
      billingPeriod: subscription.billing_period as 'monthly' | 'annual',
      startedAt: subscription.started_at,
      expiresAt: subscription.expires_at,
      currentSeats,
      maxSeats: maxSeats === -1 ? Infinity : maxSeats,
    },
    pricing: {
      seatPriceUSD,
      seatPriceARS,
      daysRemaining,
      totalDays,
      percentageRemaining: Math.round(percentageRemaining * 100),
      proratedAmountUSD,
      proratedAmountARS,
    },
    invitation: {
      email: inviteeEmail,
      roleId: roleId,
      roleName: role?.name || 'Miembro',
    }
  };
}
