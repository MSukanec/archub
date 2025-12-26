import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/core/save-engine';
import { supabase } from '@/lib/supabase';
import { generalCostsKeys } from '@/core/query-keys';
export interface GeneralCostPayment {
  id: string;
  organization_id: string;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  payment_date: string;
  notes: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
  wallet_id: string | null;
  general_cost_id: string | null;
  status: 'confirmed'| 'pending'| 'rejected'| 'void';
  created_by: string | null;
  attachments_count?: number;
  general_cost?: {
    id: string;
    name: string;
    description: string | null;
    category_id?: string | null;
    category?: {
      id: string;
      name: string;
    } | null;
  } | null;
  currency?: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  } | null;
  wallet?: {
    id: string;
    organization_id: string;
    wallet_id: string;
    is_active: boolean;
    is_default: boolean;
    wallets: {
      id: string;
      name: string;
      is_active: boolean;
    } | null;
  } | null;
  creator?: {
    id: string;
    users?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  media_links?: Array<{
    id: string;
    media_file_id: string;
    media_files: {
      id: string;
      file_name: string;
      file_type: string;
      bucket: string;
      file_path: string;
    };
  }>;
}
export function useGeneralCostsPayments(organizationId: string | undefined) {
  return useQuery({
    queryKey: generalCostsKeys.paymentList(organizationId),
    queryFn: async () => {
      if (!organizationId) return [];
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { data, error } = await supabase
        .from('general_costs_payments')
        .select(`
          id,
          organization_id,
          amount,
          currency_id,
          exchange_rate,
          payment_date,
          notes,
          reference,
          created_at,
          updated_at,
          wallet_id,
          general_cost_id,
          status,
          created_by,
          general_cost:general_costs(
            id,
            name,
            description,
            category_id,
            category:general_cost_categories(
              id,
              name
            )
          ),
          currency:currencies(
            id,
            code,
            symbol,
            name
          ),
          wallet:organization_wallets(
            id,
            organization_id,
            wallet_id,
            is_active,
            is_default,
            wallets:wallet_id(
              id,
              name,
              is_active
            )
          ),
          creator:organization_members(
            id,
            users(
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('payment_date', { ascending: false });
      if (error) {
        throw error;
      }
      return (data || []).map(payment => {
        const walletData = Array.isArray(payment.wallet) ? payment.wallet[0] : payment.wallet;
        const generalCost = Array.isArray(payment.general_cost) ? payment.general_cost[0] : payment.general_cost;
        const processedGeneralCost = generalCost ? {
          ...generalCost,
          category: Array.isArray(generalCost.category) ? generalCost.category[0] : generalCost.category
        } : null;
        const creatorData = Array.isArray(payment.creator) ? payment.creator[0] : payment.creator;
        const processedCreator = creatorData ? {
          ...creatorData,
          users: Array.isArray(creatorData.users) ? creatorData.users[0] : creatorData.users
        } : null;
        
        return {
          ...payment,
          general_cost: processedGeneralCost,
          currency: Array.isArray(payment.currency) ? payment.currency[0] : payment.currency,
          wallet: walletData ? {
            ...walletData,
            wallets: Array.isArray(walletData.wallets) ? walletData.wallets[0] : walletData.wallets
          } : null,
          creator: processedCreator,
          attachments_count: 0
        };
      }) as unknown as GeneralCostPayment[];
    },
    enabled: !!organizationId,
    staleTime: 30000,
  });
}
export function useDeleteGeneralCostPaymentInline(organizationId: string | null) {
  return useOptimisticMutation({
    mutationFn: async ({ paymentId, organizationId: orgId }: { paymentId: string; organizationId: string }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { error } = await supabase
        .from('general_costs_payments')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .eq('organization_id', orgId);
      if (error) {
        throw error;
      }
      return { paymentId };
    },
    queryKey: generalCostsKeys.paymentList(organizationId),
    optimisticUpdate: (oldData: GeneralCostPayment[] | undefined, { paymentId }: { paymentId: string; organizationId: string }) => {
      if (!oldData) return oldData;
      return oldData.filter((payment) => payment.id !== paymentId);
    },
    additionalQueryKeys: [
      generalCostsKeys.list(organizationId),
      generalCostsKeys.monthlySummaryList(organizationId),
      generalCostsKeys.byCategoryList(organizationId),
    ],
    onSuccessMessage: 'Pago eliminado',
    onErrorMessage: 'No se pudo eliminar el pago',
  });
}
