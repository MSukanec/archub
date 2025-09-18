import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Coins, Wallet, Bug } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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

interface FinancesTabProps {
  // No additional props needed
}

export function FinancesTab({}: FinancesTabProps) {
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
      queryClient.invalidateQueries({ queryKey: ['organizationCurrencies', userData?.organization?.id] });
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

      // Check if the wallet already exists for this organization
      const { data: existingWallet, error: checkError } = await supabase
        .from('organization_wallets')
        .select('id')
        .eq('organization_id', userData.organization.id)
        .eq('wallet_id', walletId)
        .single();

      console.log('🔧 Check existing wallet:', { existingWallet, checkError });

      if (existingWallet) {
        // Update existing wallet to be default
        const { error: updateError } = await supabase
          .from('organization_wallets')
          .update({ is_default: true, is_active: true })
          .eq('id', existingWallet.id);

        console.log('🔧 Update existing wallet to default:', { updateError });
        if (updateError) throw updateError;
      } else {
        // Insert new default wallet
        const { error: insertError, data: insertData } = await supabase
          .from('organization_wallets')
          .insert({
            organization_id: userData.organization.id,
            wallet_id: walletId,
            is_default: true,
            is_active: true
          })
          .select();

        console.log('🔧 Insert new default wallet:', { insertData, insertError });
        if (insertError) throw insertError;
      }

      console.log('🔧 SaveDefaultWallet: Mutation completed successfully');
    },
    onSuccess: () => {
      console.log('🔧 SaveDefaultWallet: Success callback triggered');
      toast({ title: 'Billetera por defecto actualizada', description: 'La configuración se ha guardado exitosamente.' });
      queryClient.invalidateQueries({ queryKey: ['organizationWallets', userData?.organization?.id] });
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
      toast({ 
        title: 'Monedas secundarias actualizadas', 
        description: 'La configuración de monedas se ha guardado exitosamente.' 
      });
      queryClient.invalidateQueries({ queryKey: ['organizationCurrencies', userData?.organization?.id] });
      queryClient.invalidateQueries({ queryKey: ['organizationCurrencies', userData?.organization?.id] });
    },
    onError: (error) => {
      toast({ 
        title: 'Error al actualizar monedas', 
        description: 'No se pudieron actualizar las monedas secundarias.',
        variant: 'destructive'
      });
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
      toast({ 
        title: 'Billeteras secundarias actualizadas', 
        description: 'La configuración de billeteras se ha guardado exitosamente.' 
      });
      queryClient.invalidateQueries({ queryKey: ['organizationWallets', userData?.organization?.id] });
      queryClient.invalidateQueries({ queryKey: ['organizationWallets', userData?.organization?.id] });
    },
    onError: (error) => {
      toast({ 
        title: 'Error al actualizar billeteras', 
        description: 'No se pudieron actualizar las billeteras secundarias.',
        variant: 'destructive'
      });
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

  // DEBUG FUNCTION - TEMPORAL
  const testSupabaseQueries = async () => {
    console.log('🔧 MANUAL TEST: Testing Supabase queries...');
    
    try {
      // Test 1: Basic currencies table
      console.log('🔧 TEST 1: Fetching currencies...');
      const { data: currData, error: currError } = await supabase
        .from('currencies')
        .select('*')
        .order('name');
      
      console.log('🔧 TEST 1 RESULT:', { data: currData, error: currError });

      // Test 2: Basic wallets table  
      console.log('🔧 TEST 2: Fetching wallets...');
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      console.log('🔧 TEST 2 RESULT:', { data: walletData, error: walletError });

      // Test 3: Organization currencies
      console.log('🔧 TEST 3: Fetching organization currencies...');
      const { data: orgCurrData, error: orgCurrError } = await supabase
        .from('organization_currencies')
        .select(`
          id,
          organization_id,
          currency_id,
          is_default,
          is_active,
          currency:currencies(*)
        `)
        .eq('organization_id', userData?.organization?.id)
        .order('is_default', { ascending: false });
      
      console.log('🔧 TEST 3 RESULT:', { data: orgCurrData, error: orgCurrError });

      // Test 4: Organization wallets
      console.log('🔧 TEST 4: Fetching organization wallets...');
      const { data: orgWalletData, error: orgWalletError } = await supabase
        .from('organization_wallets')
        .select(`
          *,
          wallets:wallet_id (
            id,
            name,
            created_at,
            is_active
          )
        `)
        .eq('organization_id', userData?.organization?.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false });
      
      console.log('🔧 TEST 4 RESULT:', { data: orgWalletData, error: orgWalletError });

    } catch (err) {
      console.error('🔧 TEST ERROR:', err);
    }
  };

  // Get available currencies and wallets (excluding defaults from secondary options)
  const availableSecondaryCurrencies = allCurrencies?.filter(c => c.id !== defaultCurrency) || [];
  const availableSecondaryWallets = allWallets?.filter(w => w.id !== defaultWallet) || [];

  return (
    <div className="space-y-12">
      
      {/* Sección 1: Moneda por Defecto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column - Título y Descripción */}
        <div>
          <div className="flex items-center gap-2 mb-6">
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
        <div>
          <div className="flex items-center gap-2 mb-6">
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
        <div>
          <div className="flex items-center gap-2 mb-6">
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

      {/* DEBUG SECTION - TEMPORAL */}
      <div className="mt-8 p-4 border border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Bug className="h-4 w-4 text-red-600" />
          <h3 className="text-sm font-medium text-red-800">Debug - Test Supabase Queries</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={testSupabaseQueries}
          className="text-red-700 border-red-200 hover:bg-red-100"
        >
          Test Database Queries
        </Button>
        <p className="text-xs text-red-600 mt-2">Click to test database queries and check console logs</p>
      </div>

    </div>
  );
}