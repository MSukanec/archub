import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Settings, Coins, Wallet, TrendingUp } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboBoxMultiSelectField } from '@/components/ui-custom/fields/ComboBoxMultiSelectField';
import { PlanRestricted } from '@/components/ui-custom/security/PlanRestricted';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrencies, useOrganizationCurrencies } from '@/hooks/use-currencies';
import { useAllWallets } from '@/hooks/use-wallets';
import { useOrganizationWallets } from '@/hooks/use-organization-wallets';
import { useNavigationStore } from '@/stores/navigationStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export default function Preferences() {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { data: allCurrencies } = useCurrencies();
  const { data: organizationCurrencies } = useOrganizationCurrencies(userData?.organization?.id);
  const { data: allWallets } = useAllWallets();
  const { data: organizationWallets } = useOrganizationWallets(userData?.organization?.id);
  const { toast } = useToast();

  // Form states
  const [defaultCurrency, setDefaultCurrency] = useState<string>('');
  const [secondaryCurrencies, setSecondaryCurrencies] = useState<string[]>([]);
  const [defaultWallet, setDefaultWallet] = useState<string>('');
  const [secondaryWallets, setSecondaryWallets] = useState<string[]>([]);
  const [useCurrencyExchange, setUseCurrencyExchange] = useState<string>('no');

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  // Initialize form values from organization data
  useEffect(() => {
    if (organizationCurrencies?.length) {
      const defaultCur = organizationCurrencies.find(c => c.is_default);
      const secondaryCurs = organizationCurrencies.filter(c => !c.is_default);
      
      if (defaultCur) {
        setDefaultCurrency(defaultCur.currency_id);
      }
      setSecondaryCurrencies(secondaryCurs.map(c => c.currency_id));
    }
  }, [organizationCurrencies]);

  useEffect(() => {
    if (organizationWallets?.length) {
      const defaultWal = organizationWallets.find(w => w.is_default);
      const secondaryWals = organizationWallets.filter(w => !w.is_default);
      
      if (defaultWal) {
        setDefaultWallet(defaultWal.wallet_id);
      }
      setSecondaryWallets(secondaryWals.map(w => w.wallet_id));
    } else if (organizationWallets && organizationWallets.length === 0) {
      // Reset states when no organization wallets exist
      setDefaultWallet('');
      setSecondaryWallets([]);
    }
  }, [organizationWallets]);

  useEffect(() => {
    if (userData?.organization_preferences) {
      setUseCurrencyExchange(userData.organization_preferences.use_currency_exchange ? 'si' : 'no');
    }
  }, [userData?.organization_preferences]);

  // Mutations for saving preferences
  const saveDefaultCurrencyMutation = useMutation({
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
        }, {
          onConflict: 'organization_id,currency_id'
        });

      if (error2) throw error2;
    },
    onSuccess: () => {
      toast({ title: 'Moneda por defecto actualizada', description: 'La configuración se ha guardado exitosamente.' });
      queryClient.invalidateQueries({ queryKey: ['organizationCurrencies'] });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: 'No se pudo actualizar la moneda por defecto.',
        variant: 'destructive'
      });
    }
  });

  const saveDefaultWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      console.log('🔧 SaveDefaultWallet: Starting mutation', { 
        walletId, 
        organizationId: userData?.organization?.id,
        currentOrganizationWallets: organizationWallets?.length || 0
      });

      if (!userData?.organization?.id) {
        throw new Error('No se encontró la organización');
      }

      if (!walletId) {
        throw new Error('Se debe seleccionar una billetera válida');
      }

      // First, reset all existing organization wallets to not default
      const { error: resetError, count } = await supabase
        .from('organization_wallets')
        .update({ is_default: false })
        .eq('organization_id', userData.organization.id);
      
      console.log('🔧 Reset existing default wallets:', { count, resetError });
      if (resetError) throw resetError;

      // Then upsert the new default wallet
      const { error: upsertError, data: upsertData } = await supabase
        .from('organization_wallets')
        .upsert({
          organization_id: userData.organization.id,
          wallet_id: walletId,
          is_default: true,
          is_active: true
        }, {
          onConflict: 'organization_id,wallet_id'
        })
        .select();

      console.log('🔧 Upsert new default wallet:', { upsertData, upsertError });
      if (upsertError) throw upsertError;

      console.log('🔧 SaveDefaultWallet: Mutation completed successfully');
    },
    onSuccess: () => {
      console.log('🔧 SaveDefaultWallet: Success callback triggered');
      toast({ title: 'Billetera por defecto actualizada', description: 'La configuración se ha guardado exitosamente.' });
      queryClient.invalidateQueries({ queryKey: ['organizationWallets'] });
    },
    onError: (error) => {
      console.error('🔧 SaveDefaultWallet: Error occurred:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudo actualizar la billetera por defecto.';
      toast({ 
        title: 'Error al actualizar billetera', 
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  const updateSecondaryCurrenciesMutation = useMutation({
    mutationFn: async (currencyIds: string[]) => {
      // Delete all non-default currencies
      await supabase
        .from('organization_currencies')
        .delete()
        .eq('organization_id', userData?.organization?.id)
        .eq('is_default', false);

      // Insert new secondary currencies
      if (currencyIds.length > 0) {
        const { error } = await supabase
          .from('organization_currencies')
          .insert(currencyIds.map(id => ({
            organization_id: userData?.organization?.id!,
            currency_id: id,
            is_default: false,
            is_active: true
          })));

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationCurrencies'] });
    }
  });

  const updateSecondaryWalletsMutation = useMutation({
    mutationFn: async (walletIds: string[]) => {
      // Delete all non-default wallets
      await supabase
        .from('organization_wallets')
        .delete()
        .eq('organization_id', userData?.organization?.id)
        .eq('is_default', false);

      // Insert new secondary wallets
      if (walletIds.length > 0) {
        const { error } = await supabase
          .from('organization_wallets')
          .insert(walletIds.map(id => ({
            organization_id: userData?.organization?.id!,
            wallet_id: id,
            is_default: false,
            is_active: true
          })));

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationWallets'] });
    }
  });

  const updateCurrencyExchangeMutation = useMutation({
    mutationFn: async (useExchange: string) => {
      const { error } = await supabase
        .from('organization_preferences')
        .update({ use_currency_exchange: useExchange === 'si' })
        .eq('organization_id', userData?.organization?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ 
        title: 'Configuración actualizada', 
        description: 'La configuración de cotización se ha guardado exitosamente.' 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: 'No se pudo actualizar la configuración de cotización.',
        variant: 'destructive'
      });
    }
  });

  // Handlers
  const handleDefaultCurrencyChange = (currencyId: string) => {
    setDefaultCurrency(currencyId);
    // Remove from secondary currencies if it was there
    setSecondaryCurrencies(prev => prev.filter(id => id !== currencyId));
    saveDefaultCurrencyMutation.mutate(currencyId);
  };

  const handleDefaultWalletChange = (walletId: string) => {
    setDefaultWallet(walletId);
    // Remove from secondary wallets if it was there
    setSecondaryWallets(prev => prev.filter(id => id !== walletId));
    saveDefaultWalletMutation.mutate(walletId);
  };

  const handleSecondaryCurrenciesChange = (currencyIds: string[]) => {
    setSecondaryCurrencies(currencyIds);
    updateSecondaryCurrenciesMutation.mutate(currencyIds);
  };

  const handleSecondaryWalletsChange = (walletIds: string[]) => {
    setSecondaryWallets(walletIds);
    updateSecondaryWalletsMutation.mutate(walletIds);
  };

  const handleCurrencyExchangeChange = (useExchange: string) => {
    setUseCurrencyExchange(useExchange);
    updateCurrencyExchangeMutation.mutate(useExchange);
  };

  // Get available currencies and wallets (excluding defaults from secondary options)
  const availableSecondaryCurrencies = allCurrencies?.filter(c => c.id !== defaultCurrency) || [];
  const availableSecondaryWallets = allWallets?.filter(w => w.id !== defaultWallet) || [];

  return (
    <Layout 
      wide={false}
      headerProps={{
        title: "Preferencias",
        icon: Settings,
        breadcrumb: [
          { name: "Finanzas", href: "/finances/dashboard" },
          { name: "Preferencias", href: "/finances/preferences" }
        ]
      }}
    >
      <div className="space-y-12">
        
        {/* Sección 1: Moneda por Defecto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Título y Descripción */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Moneda por Defecto</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Selecciona la moneda principal que se usará automáticamente en todos los movimientos financieros de tu organización.
            </p>
          </div>

          {/* Right Column - Campo */}
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
          </div>
        </div>

        {/* Sección 2: Monedas Secundarias y Cotización */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Título y Descripción */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Monedas Secundarias y Cotización</h2>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: "hsl(213, 100%, 30%)" }}>
                PRO
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Configura monedas adicionales y habilita la funcionalidad de cotización para gestionar tasas de cambio personalizadas.
            </p>
          </div>

          {/* Right Column - Campos */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secondary-currencies">Monedas Secundarias</Label>
              <PlanRestricted feature="allow_secondary_currencies">
                <ComboBoxMultiSelectField
                  options={availableSecondaryCurrencies.map(currency => ({
                    value: currency.id,
                    label: `${currency.name} (${currency.symbol})`
                  }))}
                  value={secondaryCurrencies}
                  onChange={handleSecondaryCurrenciesChange}
                  placeholder="Selecciona monedas secundarias"
                />
              </PlanRestricted>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency-exchange-select">Usar Cotización de Monedas</Label>
              <PlanRestricted feature="allow_exchange_rate">
                <Select value={useCurrencyExchange} onValueChange={handleCurrencyExchangeChange}>
                  <SelectTrigger id="currency-exchange-select">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No usar cotización</SelectItem>
                    <SelectItem value="si">Usar cotización</SelectItem>
                  </SelectContent>
                </Select>
              </PlanRestricted>
            </div>
          </div>
        </div>

        {/* Sección 3: Billeteras */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Título y Descripción */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Billeteras</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Define las billeteras que utilizas para gestionar tus fondos. La billetera por defecto se seleccionará automáticamente en nuevos movimientos, mientras que las secundarias estarán disponibles como opciones.
            </p>
          </div>

          {/* Right Column - Campos */}
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
    </Layout>
  );
}