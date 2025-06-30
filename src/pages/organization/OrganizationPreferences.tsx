import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DollarSign, Settings, Wallet } from 'lucide-react';

import { Layout } from '@/components/layout/Layout';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CustomComboBox } from '@/components/ui-custom/misc/CustomComboBox';
import { CustomMultiComboBox } from '@/components/ui-custom/misc/CustomMultiComboBox';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrencies } from '@/hooks/use-currencies';
import { useWallets } from '@/hooks/use-wallets';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useNavigationStore } from '@/stores/navigationStore';

interface Wallet {
  id: string;
  name: string;
  created_at: string;
}

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

interface OrganizationPreferences {
  id: string;
  organization_id: string;
  default_currency_id: string;
  default_wallet_id: string;
  default_pdf_template_id: string;
  created_at: string;
  updated_at: string;
}

export default function OrganizationPreferences() {
  const [defaultCurrency, setDefaultCurrency] = useState('none');
  const [defaultWallet, setDefaultWallet] = useState('none');
  const [secondaryCurrencies, setSecondaryCurrencies] = useState<string[]>([]);
  const [secondaryWallets, setSecondaryWallets] = useState<string[]>([]);
  
  // Auto-save debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const { setSidebarContext } = useNavigationStore();

  // Set sidebar context to organization when component mounts
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  // Fetch all currencies
  const { data: allCurrencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Currency[];
    },
  });

  // Fetch all wallets
  const { data: allWallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Wallet[];
    },
  });

  // Load existing preferences
  useEffect(() => {
    if (!organizationId) return;

    const loadPreferences = async () => {
      if (!supabase) return;
      
      try {
        // Load organization preferences
        const { data: preferences } = await supabase
          .from('organization_preferences')
          .select('*')
          .eq('organization_id', organizationId)
          .single();

        if (preferences) {
          setDefaultCurrency(preferences.default_currency_id || 'none');
          setDefaultWallet(preferences.default_wallet_id || 'none');
        }

        // Load secondary currencies
        const { data: orgCurrencies } = await supabase
          .from('organization_currencies')
          .select('currency_id, is_default')
          .eq('organization_id', organizationId);

        // Get all secondary currencies (non-default)
        const secondaryCurrs = orgCurrencies?.filter(oc => !oc.is_default).map(oc => oc.currency_id) || [];
        setSecondaryCurrencies(secondaryCurrs);

        // Load secondary wallets
        const { data: orgWallets } = await supabase
          .from('organization_wallets')
          .select('wallet_id, is_default')
          .eq('organization_id', organizationId);

        // Get all secondary wallets (non-default)
        const secondaryWalls = orgWallets?.filter(ow => !ow.is_default).map(ow => ow.wallet_id) || [];
        setSecondaryWallets(secondaryWalls);
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, [organizationId]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !supabase) {
        throw new Error('Organization ID required');
      }

      // Upsert organization preferences
      const { error: prefError } = await supabase
        .from('organization_preferences')
        .upsert({
          organization_id: organizationId,
          default_currency_id: defaultCurrency !== 'none' ? defaultCurrency : null,
          default_wallet_id: defaultWallet !== 'none' ? defaultWallet : null,
        });

      if (prefError) throw prefError;

      // Clear existing organization currencies and wallets
      await supabase
        .from('organization_currencies')
        .delete()
        .eq('organization_id', organizationId);

      await supabase
        .from('organization_wallets')
        .delete()
        .eq('organization_id', organizationId);

      // Add default currency if selected
      if (defaultCurrency && defaultCurrency !== 'none') {
        const { error: currError } = await supabase
          .from('organization_currencies')
          .insert({
            organization_id: organizationId,
            currency_id: defaultCurrency,
            is_default: true,
          });

        if (currError) throw currError;
      }

      // Add secondary currencies if selected
      if (secondaryCurrencies.length > 0) {
        const secondaryCurrencyInserts = secondaryCurrencies
          .filter(currencyId => currencyId !== defaultCurrency)
          .map(currencyId => ({
            organization_id: organizationId,
            currency_id: currencyId,
            is_default: false,
          }));

        if (secondaryCurrencyInserts.length > 0) {
          const { error: secCurrError } = await supabase
            .from('organization_currencies')
            .insert(secondaryCurrencyInserts);

          if (secCurrError) throw secCurrError;
        }
      }

      // Add default wallet if selected
      if (defaultWallet && defaultWallet !== 'none') {
        const { error: walletError } = await supabase
          .from('organization_wallets')
          .insert({
            organization_id: organizationId,
            wallet_id: defaultWallet,
            is_default: true,
          });

        if (walletError) throw walletError;
      }

      // Add secondary wallets if selected
      if (secondaryWallets.length > 0) {
        const secondaryWalletInserts = secondaryWallets
          .filter(walletId => walletId !== defaultWallet)
          .map(walletId => ({
            organization_id: organizationId,
            wallet_id: walletId,
            is_default: false,
          }));

        if (secondaryWalletInserts.length > 0) {
          const { error: secWalletError } = await supabase
            .from('organization_wallets')
            .insert(secondaryWalletInserts);

          if (secWalletError) throw secWalletError;
        }
      }
    },
    onSuccess: () => {
      // Sutil notificación de auto-guardado
      toast({
        description: "Cambios guardados automáticamente",
        duration: 2000,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['organization-preferences', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-currencies', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-wallets', organizationId] });
    },
    onError: (error) => {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar las preferencias. Se reintentará automáticamente.",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  // Auto-save function with debounce
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      savePreferencesMutation.mutate();
    }, 1500); // 1.5 seconds delay
  }, [savePreferencesMutation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Wrapper functions that trigger auto-save
  const handleDefaultCurrencyChange = useCallback((value: string) => {
    setDefaultCurrency(value);
    debouncedSave();
  }, [debouncedSave]);

  const handleDefaultWalletChange = useCallback((value: string) => {
    setDefaultWallet(value);
    debouncedSave();
  }, [debouncedSave]);

  const handleSecondaryCurrenciesChange = useCallback((values: string[]) => {
    setSecondaryCurrencies(values);
    debouncedSave();
  }, [debouncedSave]);

  const handleSecondaryWalletsChange = useCallback((values: string[]) => {
    setSecondaryWallets(values);
    debouncedSave();
  }, [debouncedSave]);

  // Convert currencies and wallets to options for CustomComboBox
  const currencyOptions = allCurrencies.map(currency => ({
    value: currency.id,
    label: `${currency.code} - ${currency.name}`
  }));

  const walletOptions = allWallets.map(wallet => ({
    value: wallet.id,
    label: wallet.name
  }));

  // Filter secondary options to exclude default selections
  const secondaryCurrencyOptions = currencyOptions.filter(option => option.value !== defaultCurrency);
  const secondaryWalletOptions = walletOptions.filter(option => option.value !== defaultWallet);

  const headerProps = {
    title: "Preferencias de Finanzas",
  };

  if (!organizationId) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <p className="text-[var(--menues-fg)] opacity-70">No hay organización seleccionada</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Preferencias de Finanzas</h1>
          <p className="text-sm text-muted-foreground">
            Configura las preferencias financieras de tu organización. Define monedas y billeteras principales y secundarias 
            para gestionar transacciones y reportes de manera eficiente.
          </p>
        </div>

        <Separator className="bg-border opacity-100" />

        {/* Monedas Section */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Column - Title and Description */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="text-lg font-semibold">Monedas</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Configura las monedas disponibles para esta organización. 
                Define una moneda principal y múltiples monedas secundarias.
              </p>
            </div>

            {/* Right Column - Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-currency">Moneda principal</Label>
                <Select value={defaultCurrency} onValueChange={handleDefaultCurrencyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin seleccionar</SelectItem>
                    {allCurrencies.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-currency">Monedas secundarias</Label>
                <CustomMultiComboBox
                  options={secondaryCurrencyOptions}
                  values={secondaryCurrencies}
                  onValuesChange={handleSecondaryCurrenciesChange}
                  placeholder="Seleccionar monedas secundarias..."
                  searchPlaceholder="Buscar monedas..."
                  emptyText="No se encontraron monedas."
                />
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-border opacity-100" />

        {/* Billeteras Section */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Column - Title and Description */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="text-lg font-semibold">Billeteras</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Configura las billeteras disponibles para esta organización. 
                Define una billetera principal y múltiples billeteras secundarias.
              </p>
            </div>

            {/* Right Column - Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-wallet">Billetera principal</Label>
                <Select value={defaultWallet} onValueChange={handleDefaultWalletChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar billetera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin seleccionar</SelectItem>
                    {allWallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-wallet">Billeteras secundarias</Label>
                <CustomMultiComboBox
                  options={secondaryWalletOptions}
                  values={secondaryWallets}
                  onValuesChange={handleSecondaryWalletsChange}
                  placeholder="Seleccionar billeteras secundarias..."
                  searchPlaceholder="Buscar billeteras..."
                  emptyText="No se encontraron billeteras."
                />
              </div>
            </div>
          </div>
        </div>


      </div>
    </Layout>
  );
}