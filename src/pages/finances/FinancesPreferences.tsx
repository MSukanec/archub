import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Coins } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomMultiComboBox } from '@/components/ui-custom/misc/CustomMultiComboBox';
import { HelpPopover } from '@/components/ui-custom/HelpPopover';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrencies, useOrganizationCurrencies } from '@/hooks/use-currencies';
import { useAllWallets } from '@/hooks/use-wallets';
import { useOrganizationWallets } from '@/hooks/use-organization-wallets';
import { useNavigationStore } from '@/stores/navigationStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export default function FinancesPreferences() {
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

  // Set sidebar context on component mount
  useEffect(() => {
    setSidebarContext('organizacion');
  }, [setSidebarContext]);

  // Load existing organization preferences
  const { data: preferences } = useQuery({
    queryKey: ['organization-preferences', userData?.organization?.id],
    queryFn: async () => {
      if (!userData?.organization?.id) return null;
      
      const { data, error } = await supabase
        .from('organization_preferences')
        .select('*')
        .eq('organization_id', userData.organization.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
    enabled: !!userData?.organization?.id,
  });

  // Initialize form with existing data
  useEffect(() => {
    if (organizationCurrencies && organizationWallets) {
      // Find default currency
      const defaultCurrencyRecord = organizationCurrencies.find(oc => 
        oc.currency && preferences?.default_currency_id === oc.currency.id
      );
      if (defaultCurrencyRecord) {
        setDefaultCurrency(defaultCurrencyRecord.currency.id);
      }

      // Find default wallet - same logic as currencies
      const defaultWalletRecord = organizationWallets.find(ow => ow.is_default);
      if (defaultWalletRecord?.wallets) {
        setDefaultWallet(defaultWalletRecord.wallets.id);
      }

      // Set secondary currencies (all except default)
      const secondaryCurrencyIds = organizationCurrencies
        .filter(oc => oc.currency && oc.currency.id !== defaultCurrency)
        .map(oc => oc.currency.id);
      setSecondaryCurrencies(secondaryCurrencyIds);

      // Set secondary wallets - same logic as currencies
      const secondaryWalletIds = organizationWallets
        .filter(ow => !ow.is_default && ow.wallets)
        .map(ow => ow.wallets!.id);
      setSecondaryWallets(secondaryWalletIds);
    }
  }, [organizationCurrencies, organizationWallets, preferences, defaultCurrency]);

  // Save default currency mutation
  const saveDefaultCurrencyMutation = useMutation({
    mutationFn: async (currencyId: string) => {
      if (!userData?.organization?.id) throw new Error('No organization found');

      const { error } = await supabase
        .from('organization_preferences')
        .upsert({
          organization_id: userData.organization.id,
          default_currency_id: currencyId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-preferences'] });
      toast({ title: "Moneda por defecto actualizada", description: "Los cambios se han guardado correctamente." });
    },
  });

  // Save default wallet mutation
  const saveDefaultWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      if (!userData?.organization?.id) throw new Error('No organization found');

      // First, remove default from all wallets
      await supabase
        .from('organization_wallets')
        .update({ is_default: false })
        .eq('organization_id', userData.organization.id);

      // Then set the new default
      const { error } = await supabase
        .from('organization_wallets')
        .update({ is_default: true })
        .eq('organization_id', userData.organization.id)
        .eq('wallet_id', walletId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-wallets'] });
      toast({ title: "Billetera por defecto actualizada", description: "Los cambios se han guardado correctamente." });
    },
  });

  // Add/remove secondary currencies
  const updateSecondaryCurrenciesMutation = useMutation({
    mutationFn: async (currencyIds: string[]) => {
      if (!userData?.organization?.id) throw new Error('No organization found');

      // Get current organization currencies
      const { data: currentCurrencies } = await supabase
        .from('organization_currencies')
        .select('currency_id')
        .eq('organization_id', userData.organization.id);

      const currentIds = currentCurrencies?.map(c => c.currency_id) || [];
      const allSelectedIds = [defaultCurrency, ...currencyIds].filter(Boolean);

      // Remove currencies that are not selected
      const toRemove = currentIds.filter(id => !allSelectedIds.includes(id));
      if (toRemove.length > 0) {
        await supabase
          .from('organization_currencies')
          .delete()
          .eq('organization_id', userData.organization.id)
          .in('currency_id', toRemove);
      }

      // Add new currencies
      const toAdd = allSelectedIds.filter(id => !currentIds.includes(id));
      if (toAdd.length > 0) {
        const newRecords = toAdd.map(currencyId => ({
          organization_id: userData.organization.id,
          currency_id: currencyId,
          is_active: true,
          is_default: currencyId === defaultCurrency,
        }));

        await supabase
          .from('organization_currencies')
          .insert(newRecords);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-currencies'] });
      toast({ title: "Monedas secundarias actualizadas", description: "Los cambios se han guardado correctamente." });
    },
  });

  // Add/remove secondary wallets
  const updateSecondaryWalletsMutation = useMutation({
    mutationFn: async (walletIds: string[]) => {
      if (!userData?.organization?.id) throw new Error('No organization found');

      // Get current organization wallets
      const { data: currentWallets } = await supabase
        .from('organization_wallets')
        .select('wallet_id')
        .eq('organization_id', userData.organization.id);

      const currentIds = currentWallets?.map(w => w.wallet_id) || [];
      const allSelectedIds = [defaultWallet, ...walletIds].filter(Boolean);

      // Remove wallets that are not selected
      const toRemove = currentIds.filter(id => !allSelectedIds.includes(id));
      if (toRemove.length > 0) {
        await supabase
          .from('organization_wallets')
          .delete()
          .eq('organization_id', userData.organization.id)
          .in('wallet_id', toRemove);
      }

      // Add new wallets
      const toAdd = allSelectedIds.filter(id => !currentIds.includes(id));
      if (toAdd.length > 0) {
        const newRecords = toAdd.map(walletId => ({
          organization_id: userData.organization.id,
          wallet_id: walletId,
          is_active: true,
          is_default: walletId === defaultWallet,
        }));

        await supabase
          .from('organization_wallets')
          .insert(newRecords);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-wallets'] });
      toast({ title: "Billeteras secundarias actualizadas", description: "Los cambios se han guardado correctamente." });
    },
  });

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

  // Get available currencies and wallets (excluding defaults from secondary options)
  const availableSecondaryCurrencies = allCurrencies?.filter(c => c.id !== defaultCurrency) || [];
  const availableSecondaryWallets = allWallets?.filter(w => w.id !== defaultWallet) || [];

  return (
    <Layout headerProps={{ title: "Preferencias" }}>
      <div className="max-w-4xl mx-auto space-y-8">
        <FeatureIntroduction
          icon={<Coins className="h-5 w-5" />}
          title="Preferencias de la Organización"
          features={[
            {
              icon: <Coins className="h-4 w-4" />,
              title: "Monedas Predeterminadas",
              description: "Configurar monedas predeterminadas y secundarias para movimientos financieros"
            },
            {
              icon: <Coins className="h-4 w-4" />,
              title: "Billeteras por Defecto",
              description: "Establecer billeteras por defecto para optimizar la gestión de flujo de caja"
            },
            {
              icon: <Coins className="h-4 w-4" />,
              title: "Opciones de Movimientos",
              description: "Personalizar las opciones disponibles al crear nuevos movimientos"
            },
            {
              icon: <Coins className="h-4 w-4" />,
              title: "Preferencias Globales",
              description: "Administrar las preferencias globales que afectan a todos los proyectos"
            }
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Titles and Descriptions */}
          <div className="space-y-12">
            {/* Monedas y Billeteras Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-lg font-semibold">Monedas y Billeteras</h2>
                <HelpPopover 
                  title="Monedas y Billeteras"
                  description="Estas configuraciones determinan qué monedas y billeteras tendrás disponibles al crear movimientos financieros. Tu selección por defecto se usará automáticamente en nuevos movimientos, mientras que las secundarias aparecerán como opciones adicionales."
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Configura las monedas y billeteras que utilizas frecuentemente en tu organización
              </p>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-8">
            {/* Monedas y Billeteras */}
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
                <Label htmlFor="secondary-currencies">Monedas Secundarias</Label>
                <CustomMultiComboBox
                  options={availableSecondaryCurrencies.map(currency => ({
                    value: currency.id,
                    label: `${currency.name} (${currency.symbol})`
                  }))}
                  values={secondaryCurrencies}
                  onValuesChange={handleSecondaryCurrenciesChange}
                  placeholder="Selecciona monedas secundarias"
                  searchPlaceholder="Buscar monedas..."
                />
              </div>

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
                <CustomMultiComboBox
                  options={availableSecondaryWallets.map(wallet => ({
                    value: wallet.id,
                    label: wallet.name
                  }))}
                  values={secondaryWallets}
                  onValuesChange={handleSecondaryWalletsChange}
                  placeholder="Selecciona billeteras secundarias"
                  searchPlaceholder="Buscar billeteras..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}