import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DollarSign, CreditCard, Coins, Wallet, Bell, Settings } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { CustomMultiComboBox } from '@/components/ui-custom/misc/CustomMultiComboBox';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrencies } from '@/hooks/use-currencies';
import { useWallets } from '@/hooks/use-wallets';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useNavigationStore } from '@/stores/navigationStore';

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

interface Wallet {
  id: string;
  name: string;
  created_at: string;
}

interface OrganizationPreferences {
  id: string;
  organization_id: string;
  default_currency_id: string;
  default_wallet_id: string;
  secondary_currencies: string[];
  secondary_wallets: string[];
  enable_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export default function FinancesPreferences() {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { data: currencies } = useCurrencies();
  const { data: wallets } = useWallets();
  const { toast } = useToast();

  // Auto-save debounce refs
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [pendingChanges, setPendingChanges] = useState(false);

  // Form states
  const [defaultCurrency, setDefaultCurrency] = useState<string>('');
  const [secondaryCurrencies, setSecondaryCurrencies] = useState<string[]>([]);
  const [defaultWallet, setDefaultWallet] = useState<string>('');
  const [secondaryWallets, setSecondaryWallets] = useState<string[]>([]);
  const [enableNotifications, setEnableNotifications] = useState(false);

  // Set sidebar context on component mount
  useEffect(() => {
    setSidebarContext('finances');
  }, [setSidebarContext]);

  // Fetch organization preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['organization-preferences', userData?.organization?.id],
    queryFn: async () => {
      if (!userData?.organization?.id) {
        throw new Error('No organization found');
      }

      const { data, error } = await supabase
        ?.from('organization_preferences')
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

  // Set form values when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setDefaultCurrency(preferences.default_currency_id || '');
      setDefaultWallet(preferences.default_wallet_id || '');
      setSecondaryCurrencies(preferences.secondary_currencies || []);
      setSecondaryWallets(preferences.secondary_wallets || []);
      setEnableNotifications(preferences.enable_notifications || false);
    }
  }, [preferences]);

  // Auto-save mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!userData?.organization?.id) {
        throw new Error('No organization found');
      }

      const { error } = await supabase
        ?.from('organization_preferences')
        .upsert(
          {
            organization_id: userData.organization.id,
            default_currency_id: data.defaultCurrency || null,
            default_wallet_id: data.defaultWallet || null,
            secondary_currencies: data.secondaryCurrencies || [],
            secondary_wallets: data.secondaryWallets || [],
            enable_notifications: data.enableNotifications || false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-preferences'] });
      setPendingChanges(false);
      toast({
        title: "Cambios guardados automáticamente",
        description: "Las preferencias de finanzas se han actualizado correctamente.",
      });
    },
    onError: (error: any) => {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error al guardar",
        description: "Hubo un problema al guardar las preferencias. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Debounced auto-save function
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (pendingChanges) {
        savePreferencesMutation.mutate({
          defaultCurrency,
          defaultWallet,
          secondaryCurrencies,
          secondaryWallets,
          enableNotifications,
        });
      }
    }, 1500); // 1.5 second delay
  }, [defaultCurrency, defaultWallet, secondaryCurrencies, secondaryWallets, enableNotifications, pendingChanges, savePreferencesMutation]);

  // Trigger auto-save when form values change
  useEffect(() => {
    if (preferences) { // Only auto-save after initial load
      setPendingChanges(true);
      debouncedSave();
    }
  }, [defaultCurrency, defaultWallet, secondaryCurrencies, secondaryWallets, enableNotifications, debouncedSave, preferences]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Wrapper functions for state setters
  const handleCurrencyChange = (value: string) => {
    setDefaultCurrency(value);
  };

  const handleWalletChange = (value: string) => {
    setDefaultWallet(value);
  };

  const handleSecondaryCurrenciesChange = (values: string[]) => {
    setSecondaryCurrencies(values);
  };

  const handleSecondaryWalletsChange = (values: string[]) => {
    setSecondaryWallets(values);
  };

  const handleNotificationsChange = (checked: boolean) => {
    setEnableNotifications(checked);
  };

  if (isLoadingPreferences) {
    return (
      <Layout headerProps={{ title: "Configuración de Finanzas" }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando preferencias...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={{ title: "Configuración de Finanzas" }}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Configuración de Finanzas</h1>
          <p className="text-sm text-muted-foreground">
            Configura las preferencias financieras de tu organización, incluyendo monedas y billeteras predeterminadas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Titles and Descriptions */}
          <div className="space-y-12">
            {/* Monedas y Billeteras Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                <h2 className="text-lg font-semibold">Monedas y Billeteras</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Configura las monedas y billeteras que utilizas frecuentemente en tu organización
              </p>
            </div>

            {/* Notificaciones Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <h2 className="text-lg font-semibold">Notificaciones</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Controla qué notificaciones financieras quieres recibir en tu organización
              </p>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-8">
            {/* Monedas y Billeteras */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-currency" className="required-asterisk">Moneda por Defecto</Label>
                <Select value={defaultCurrency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger id="default-currency">
                    <SelectValue placeholder="Selecciona una moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies?.map((currency) => (
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
                  options={currencies?.filter(c => c.id !== defaultCurrency).map(currency => ({
                    value: currency.id,
                    label: `${currency.name} (${currency.symbol})`
                  })) || []}
                  values={secondaryCurrencies}
                  onValuesChange={handleSecondaryCurrenciesChange}
                  placeholder="Selecciona monedas secundarias"
                  searchPlaceholder="Buscar monedas..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-wallet" className="required-asterisk">Billetera por Defecto</Label>
                <Select value={defaultWallet} onValueChange={handleWalletChange}>
                  <SelectTrigger id="default-wallet">
                    <SelectValue placeholder="Selecciona una billetera" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets?.map((wallet) => (
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
                  options={wallets?.filter(w => w.id !== defaultWallet).map(wallet => ({
                    value: wallet.id,
                    label: wallet.name
                  })) || []}
                  values={secondaryWallets}
                  onValuesChange={handleSecondaryWalletsChange}
                  placeholder="Selecciona billeteras secundarias"
                  searchPlaceholder="Buscar billeteras..."
                />
              </div>
            </div>

            <Separator />

            {/* Notifications Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-notifications">Habilitar notificaciones financieras</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe notificaciones sobre movimientos importantes y alertas financieras
                  </p>
                </div>
                <Switch
                  id="enable-notifications"
                  checked={enableNotifications}
                  onCheckedChange={handleNotificationsChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}