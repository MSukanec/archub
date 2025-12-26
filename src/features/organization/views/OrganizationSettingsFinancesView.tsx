import { useState, useEffect, useRef } from 'react';
import { Coins, Wallet } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboBoxMultiSelectField } from '@/components/shared/fields/ComboBoxMultiSelectField';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrencies, useOrganizationCurrencies } from '@/hooks/use-currencies';
import { useAllWallets } from '@/hooks/use-wallets';
import { useOrganizationWallets } from '@/features/organization';
import { useOptimisticMutation } from '@/core/save-engine';
import { organizationKeys } from '@/core/query-keys';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
export function OrganizationSettingsFinancesView() {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: allCurrencies, isLoading: isLoadingAllCurrencies } = useCurrencies();
  const { data: organizationCurrencies, isLoading: isLoadingOrgCurrencies } = useOrganizationCurrencies(organizationId);
  const { data: allWallets } = useAllWallets();
  const { data: organizationWallets } = useOrganizationWallets(organizationId);
  const { toast } = useToast();
  const [defaultCurrency, setDefaultCurrency] = useState<string>('');
  const [secondaryCurrency, setSecondaryCurrency] = useState<string>('');
  const [defaultWallet, setDefaultWallet] = useState<string>('');
  const [secondaryWallets, setSecondaryWallets] = useState<string[]>([]);
  
  const prevOrganizationId = useRef<string | undefined>(undefined);
  const saveDefaultCurrencyMutation = useOptimisticMutation({
    mutationFn: async (currencyId: string) => {
      const { error } = await supabase
        .from('organization_currencies')
        .update({ is_default: false })
        .eq('organization_id', userData?.organization?.id);
      if (error) throw error;
      const { error: error2 } = await supabase
        .from('organization_currencies')
        .upsert({
          organization_id: userData?.organization?.id!,
          currency_id: currencyId,
          is_default: true,
          is_active: true
        }, { onConflict: 'organization_id,currency_id'});
      if (error2) throw error2;
    },
    queryKey: organizationKeys.currencies(userData?.organization?.id),
    optimisticUpdate: (oldData, currencyId) => {
      if (!oldData) return oldData;
      return oldData.map((c: any) => ({
        ...c,
        is_default: c.currency_id === currencyId
      }));
    },
    onSuccessMessage: 'Moneda por defecto actualizada',
    onErrorMessage: 'No se pudo actualizar la moneda por defecto',
  });
  const saveDefaultWalletMutation = useOptimisticMutation({
    mutationFn: async (walletId: string) => {
      if (!userData?.organization?.id) throw new Error('No se encontró la organización');
      if (!walletId) throw new Error('Se debe seleccionar una billetera válida');
      const { error: updateError } = await supabase
        .from('organization_wallets')
        .update({ is_default: false })
        .eq('organization_id', userData.organization.id)
        .eq('is_default', true);
      if (updateError) throw updateError;
      const { error: upsertError } = await supabase
        .from('organization_wallets')
        .upsert({
          organization_id: userData.organization.id,
          wallet_id: walletId,
          is_active: true,
          is_default: true,
        }, { onConflict: 'organization_id,wallet_id'})
        .select();
      if (upsertError) throw upsertError;
    },
    queryKey: organizationKeys.wallets(userData?.organization?.id),
    optimisticUpdate: (oldData, walletId) => {
      if (!oldData) return oldData;
      return oldData.map((w: any) => ({
        ...w,
        is_default: w.wallet_id === walletId
      }));
    },
    onSuccessMessage: 'Billetera por defecto actualizada',
    onErrorMessage: 'No se pudo actualizar la billetera por defecto',
  });
  const updateSecondaryCurrenciesMutation = useOptimisticMutation({
    mutationFn: async (currencyIds: string[]) => {
      const orgId = userData?.organization?.id;
      if (!orgId) throw new Error('Organización no encontrada');
      
      const currentSecondary = organizationCurrencies?.filter(c => !c.is_default) || [];
      const currentSecondaryIds = currentSecondary.map(c => c.currency_id);
      
      const currenciesToRemove = currentSecondaryIds.filter(id => !currencyIds.includes(id));
      const currenciesToAdd = currencyIds.filter(id => !currentSecondaryIds.includes(id));
      
      if (currenciesToRemove.length > 0) {
        const { data: movementsUsingCurrency, error: checkError } = await supabase
          .from('movements')
          .select('id')
          .eq('organization_id', orgId)
          .in('currency_id', currenciesToRemove)
          .limit(1);
        
        if (checkError) throw checkError;
        
        if (movementsUsingCurrency && movementsUsingCurrency.length > 0) {
          throw new Error(
            'No puedes eliminar monedas que tienen movimientos registrados. Primero elimina o modifica los movimientos que usan estas monedas.'
          );
        }
        
        const { error: softDeleteError } = await supabase
          .from('organization_currencies')
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString(),
            is_active: false 
          })
          .eq('organization_id', orgId)
          .in('currency_id', currenciesToRemove);
        
        if (softDeleteError) throw softDeleteError;
      }
      for (const currencyId of currenciesToAdd) {
        const { data: existingRecord } = await supabase
          .from('organization_currencies')
          .select('id, is_deleted')
          .eq('organization_id', orgId)
          .eq('currency_id', currencyId)
          .single();
        
        if (existingRecord) {
          const { error: reactivateError } = await supabase
            .from('organization_currencies')
            .update({ 
              is_deleted: false, 
              deleted_at: null,
              is_active: true 
            })
            .eq('id', existingRecord.id);
          
          if (reactivateError) throw reactivateError;
        } else {
          const { error: insertError } = await supabase
            .from('organization_currencies')
            .insert({
              organization_id: orgId,
              currency_id: currencyId,
              is_default: false,
              is_active: true,
              is_deleted: false
            });
          
          if (insertError) throw insertError;
        }
      }
    },
    queryKey: organizationKeys.currencies(userData?.organization?.id),
    optimisticUpdate: (oldData: any[], currencyIds: string[]) => {
      if (!oldData) return oldData;
      const defaultCurrencyData = oldData.find((c: any) => c.is_default);
      const newSecondaries = currencyIds.map(currencyId => {
        const existing = oldData.find((c: any) => c.currency_id === currencyId);
        if (existing) return { ...existing, is_active: true, is_deleted: false };
        const currency = allCurrencies?.find(c => c.id === currencyId);
        return {
          id: `temp-${currencyId}`,
          organization_id: userData?.organization?.id,
          currency_id: currencyId,
          is_default: false,
          is_active: true,
          is_deleted: false,
          currency: currency || { id: currencyId, name: '', symbol: '', code: ''},
        };
      });
      return defaultCurrencyData ? [defaultCurrencyData, ...newSecondaries] : newSecondaries;
    },
    onSuccessMessage: 'Monedas secundarias actualizadas',
    onErrorMessage: 'No se pudieron actualizar las monedas secundarias',
  });
  const updateSecondaryWalletsMutation = useOptimisticMutation({
    mutationFn: async (walletIds: string[]) => {
      const orgId = userData?.organization?.id;
      if (!orgId) throw new Error('Organización no encontrada');
      
      const currentSecondary = organizationWallets?.filter(w => !w.is_default) || [];
      const currentSecondaryIds = currentSecondary.map(w => w.wallet_id);
      
      const walletsToRemove = currentSecondary.filter(w => !walletIds.includes(w.wallet_id));
      const walletIdsToAdd = walletIds.filter(id => !currentSecondaryIds.includes(id));
      
      if (walletsToRemove.length > 0) {
        const walletIdsToCheck = walletsToRemove.map(w => w.id);
        
        const { data: movementsUsingWallet, error: checkError } = await supabase
          .from('movements')
          .select('id')
          .in('wallet_id', walletIdsToCheck)
          .limit(1);
        
        if (checkError) throw checkError;
        
        if (movementsUsingWallet && movementsUsingWallet.length > 0) {
          throw new Error(
            'No puedes eliminar billeteras que tienen movimientos registrados. Primero elimina o reasigna los movimientos que usan estas billeteras.'
          );
        }
        
        const { error: softDeleteError } = await supabase
          .from('organization_wallets')
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString(),
            is_active: false 
          })
          .eq('organization_id', orgId)
          .in('wallet_id', walletsToRemove.map(w => w.wallet_id));
        
        if (softDeleteError) throw softDeleteError;
      }
      for (const walletId of walletIdsToAdd) {
        const { data: existingRecord } = await supabase
          .from('organization_wallets')
          .select('id, is_deleted')
          .eq('organization_id', orgId)
          .eq('wallet_id', walletId)
          .single();
        
        if (existingRecord) {
          const { error: reactivateError } = await supabase
            .from('organization_wallets')
            .update({ 
              is_deleted: false, 
              deleted_at: null,
              is_active: true 
            })
            .eq('id', existingRecord.id);
          
          if (reactivateError) throw reactivateError;
        } else {
          const { error: insertError } = await supabase
            .from('organization_wallets')
            .insert({
              organization_id: orgId,
              wallet_id: walletId,
              is_default: false,
              is_active: true,
              is_deleted: false
            });
          
          if (insertError) throw insertError;
        }
      }
    },
    queryKey: organizationKeys.wallets(userData?.organization?.id),
    optimisticUpdate: (oldData: any[], walletIds: string[]) => {
      if (!oldData) return oldData;
      const defaultWalletData = oldData.find((w: any) => w.is_default);
      const newSecondaries = walletIds.map(walletId => {
        const existing = oldData.find((w: any) => w.wallet_id === walletId);
        if (existing) return { ...existing, is_active: true, is_deleted: false };
        const wallet = allWallets?.find(w => w.id === walletId);
        return {
          id: `temp-${walletId}`,
          organization_id: userData?.organization?.id,
          wallet_id: walletId,
          is_default: false,
          is_active: true,
          is_deleted: false,
          wallets: wallet || { id: walletId, name: '', is_active: true },
        };
      });
      return defaultWalletData ? [defaultWalletData, ...newSecondaries] : newSecondaries;
    },
    onSuccessMessage: 'Billeteras secundarias actualizadas',
    onErrorMessage: 'No se pudieron actualizar las billeteras secundarias',
  });
  useEffect(() => {
    if (prevOrganizationId.current !== organizationId) {
      prevOrganizationId.current = organizationId;
      setDefaultCurrency('');
      setSecondaryCurrency('');
      setDefaultWallet('');
      setSecondaryWallets([]);
    }
  }, [organizationId]);
  const hasDefaultCurrency = organizationCurrencies?.some(c => c.is_default) ?? false;
  const needsDefaultCurrency = !isLoadingOrgCurrencies && 
                                !isLoadingAllCurrencies && 
                                organizationCurrencies !== undefined && 
                                !hasDefaultCurrency &&
                                !saveDefaultCurrencyMutation.isPending;
  useEffect(() => {
    if (isLoadingOrgCurrencies || isLoadingAllCurrencies) return;
    
    if (organizationCurrencies?.length) {
      const defaultCur = organizationCurrencies.find(c => c.is_default);
      const secondaryCur = organizationCurrencies.find(c => !c.is_default);
      
      if (defaultCur) {
        setDefaultCurrency(defaultCur.currency_id);
      }
      setSecondaryCurrency(secondaryCur?.currency_id || '');
    }
  }, [organizationCurrencies, isLoadingOrgCurrencies, isLoadingAllCurrencies]);
  useEffect(() => {
    if (!needsDefaultCurrency) return;
    
    let currencyToSet: string | undefined;
    
    if (organizationCurrencies?.length) {
      currencyToSet = organizationCurrencies[0].currency_id;
    } else if (allCurrencies?.length) {
      currencyToSet = allCurrencies[0].id;
    }
    
    if (currencyToSet) {
      setDefaultCurrency(currencyToSet);
      saveDefaultCurrencyMutation.mutate(currencyToSet);
    }
  }, [needsDefaultCurrency, organizationCurrencies, allCurrencies]);
  useEffect(() => {
    if (organizationWallets?.length) {
      const defaultWal = organizationWallets.find(w => w.is_default);
      const secondaryWals = organizationWallets.filter(w => !w.is_default);
      
      if (defaultWal) {
        setDefaultWallet(defaultWal.wallet_id);
      }
      setSecondaryWallets(secondaryWals.map(w => w.wallet_id));
    } else if (organizationWallets && organizationWallets.length === 0) {
      setDefaultWallet('');
      setSecondaryWallets([]);
    }
  }, [organizationWallets]);
  const handleDefaultCurrencyChange = (currencyId: string) => {
    setDefaultCurrency(currencyId);
    if (secondaryCurrency === currencyId) {
      setSecondaryCurrency('');
    }
    saveDefaultCurrencyMutation.mutate(currencyId);
  };
  const handleDefaultWalletChange = (walletId: string) => {
    setDefaultWallet(walletId);
    setSecondaryWallets(prev => prev.filter(id => id !== walletId));
    saveDefaultWalletMutation.mutate(walletId);
  };
  const handleSecondaryCurrencyChange = (currencyId: string) => {
    setSecondaryCurrency(currencyId);
    updateSecondaryCurrenciesMutation.mutate(currencyId ? [currencyId] : []);
  };
  const handleSecondaryWalletsChange = (walletIds: string[]) => {
    setSecondaryWallets(walletIds);
    updateSecondaryWalletsMutation.mutate(walletIds);
  };
  const availableSecondaryCurrencies = allCurrencies?.filter(c => c.id !== defaultCurrency) || [];
  const availableSecondaryWallets = allWallets?.filter(w => w.id !== defaultWallet) || [];
  return (
    <div className="space-y-12">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Coins className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Monedas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Define la moneda principal de tu organización y agrega monedas secundarias para gestionar movimientos en diferentes divisas.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-currency">Moneda por Defecto</Label>
            <Select value={defaultCurrency} onValueChange={handleDefaultCurrencyChange}>
              <SelectTrigger id="default-currency">
                <SelectValue placeholder="Selecciona una moneda" />
              </SelectTrigger>
              <SelectContent>
                {allCurrencies?.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.name} ({currency.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary-currency">Moneda Secundaria (Opcional)</Label>
            <Select value={secondaryCurrency} onValueChange={handleSecondaryCurrencyChange}>
              <SelectTrigger id="secondary-currency">
                <SelectValue placeholder="Selecciona una moneda secundaria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ninguna</SelectItem>
                {availableSecondaryCurrencies?.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.name} ({currency.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Billeteras</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Define las billeteras que utilizas para gestionar tus fondos. La billetera por defecto se seleccionará automáticamente en nuevos movimientos, mientras que las secundarias estarán disponibles como opciones.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-wallet">Billetera por Defecto</Label>
            <Select value={defaultWallet} onValueChange={handleDefaultWalletChange}>
              <SelectTrigger id="default-wallet">
                <SelectValue placeholder="Selecciona una billetera" />
              </SelectTrigger>
              <SelectContent>
                {allWallets?.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary-wallets">Billeteras Secundarias</Label>
            <ComboBoxMultiSelectField
              options={availableSecondaryWallets.map(wallet => ({
                value: wallet.id,
                label: wallet.name
              }))}
              value={secondaryWallets}
              onChange={handleSecondaryWalletsChange}
              placeholder="Selecciona billeteras secundarias"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
