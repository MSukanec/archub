import { useState, useEffect, useMemo } from 'react';
import { useCurrentUser } from '@/features/users/hooks';
import { useProjectContext } from '@/stores/projectContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

export interface UpgradeFormData {
  currentPlan: {
    name: string;
    slug: string;
  };
  targetPlan: {
    name: string;
    slug: string;
    monthly_amount: number;
    annual_amount: number;
    features?: {
      max_projects?: number;
      max_storage_mb?: number;
      max_file_size_mb?: number;
      max_members?: number;
      [key: string]: any;
    };
  };
  billingPeriod: 'monthly' | 'annual';
  isManualPlan: boolean;
}

interface ProrationResult {
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

export interface UseUpgradeFormProps {
  formData: UpgradeFormData;
  onClose: () => void;
}

export function useUpgradeForm({ formData, onClose }: UseUpgradeFormProps) {
  const { toast } = useToast();
  const { currentOrganizationId } = useProjectContext();
  const { data: userData } = useCurrentUser();
  const [, navigate] = useLocation();
  
  const [prorationData, setProrationData] = useState<ProrationResult | null>(null);
  const [isLoadingProration, setIsLoadingProration] = useState(true);
  const [prorationError, setProrationError] = useState<Error | null>(null);

  const { currentPlan, targetPlan, billingPeriod, isManualPlan } = formData;

  useEffect(() => {
    const loadProration = async () => {
      if (!currentOrganizationId || !targetPlan.slug) {
        setIsLoadingProration(false);
        return;
      }

      try {
        setIsLoadingProration(true);
        setProrationError(null);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setIsLoadingProration(false);
          return;
        }

        const response = await fetch('/api/checkout/calculate-proration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            organization_id: currentOrganizationId,
            target_plan_slug: targetPlan.slug,
            billing_period: billingPeriod,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to calculate proration');
        }
        
        const data = await response.json();
        setProrationData(data.data);
      } catch (error) {
        console.error('[useUpgradeForm] Proration error:', error);
        setProrationError(error as Error);
      } finally {
        setIsLoadingProration(false);
      }
    };

    loadProration();
  }, [currentOrganizationId, targetPlan.slug, billingPeriod]);

  const isOwner = useMemo(() => {
    if (!userData?.user?.id || !userData?.organization) {
      return false;
    }
    return userData.organization.owner_id === userData.user.id;
  }, [userData?.user?.id, userData?.organization?.owner_id]);

  const validationError = useMemo(() => {
    if (!targetPlan?.slug) {
      return "Plan de destino no válido";
    }
    if (!currentOrganizationId) {
      return "No se ha seleccionado una organización";
    }
    if (!userData?.user) {
      return "No se pudo verificar tu identidad";
    }
    if (!userData?.organization) {
      return "No se pudo verificar la organización";
    }
    if (!isOwner) {
      return "Solo el propietario de la organización puede cambiar el plan";
    }
    return null;
  }, [targetPlan?.slug, currentOrganizationId, userData?.user, userData?.organization, isOwner]);

  const handleConfirm = () => {
    if (validationError || isManualPlan) return;
    navigate(`/subscription/checkout?plan=${targetPlan.slug}&billing=${billingPeriod}`);
    onClose();
  };

  const hasProration = prorationData?.hasActiveSubscription && prorationData?.credit && prorationData.credit.creditAmount > 0;
  const needsProration = currentPlan.slug !== 'free';
  const isConfirmDisabled = !!validationError || isManualPlan || (needsProration && isLoadingProration);

  return {
    prorationData,
    isLoadingProration,
    prorationError,
    validationError,
    isOwner,
    isManualPlan,
    hasProration,
    needsProration,
    isConfirmDisabled,
    handleConfirm,
    onClose,
    userData,
  };
}
