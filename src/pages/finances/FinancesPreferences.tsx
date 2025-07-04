import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DollarSign, Settings, Wallet, Tags, Plus, Trash2 } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomComboBox } from '@/components/ui-custom/misc/CustomComboBox';
import { CustomMultiComboBox } from '@/components/ui-custom/misc/CustomMultiComboBox';
import { CustomMovementConcepts } from '@/components/ui-custom/misc/CustomMovementConcepts';

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

interface MovementConcept {
  id: string;
  name: string;
  parent_id?: string;
  organization_id?: string;
  is_system: boolean;
  children?: MovementConcept[];
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
  const [defaultWallet, setDefaultWallet] = useState<string>('');
  const [pdfTemplateOptions, setPdfTemplateOptions] = useState<string[]>([]);
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);

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

  // Set form values when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setDefaultCurrency(preferences.default_currency_id || '');
      setDefaultWallet(preferences.default_wallet_id || '');
      setPdfTemplateOptions(preferences.pdf_template_options || []);
      setEnableNotifications(preferences.enable_notifications || false);
      setAutoBackup(preferences.auto_backup || false);
    }
  }, [preferences]);

  // Auto-save mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!userData?.organization?.id) {
        throw new Error('No organization found');
      }

      const { error } = await supabase
        .from('organization_preferences')
        .upsert(
          {
            organization_id: userData.organization.id,
            default_currency_id: data.defaultCurrency || null,
            default_wallet_id: data.defaultWallet || null,
            pdf_template_options: data.pdfTemplateOptions || [],
            enable_notifications: data.enableNotifications || false,
            auto_backup: data.autoBackup || false,
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
          pdfTemplateOptions,
          enableNotifications,
          autoBackup,
        });
      }
    }, 1500); // 1.5 second delay
  }, [defaultCurrency, defaultWallet, pdfTemplateOptions, enableNotifications, autoBackup, pendingChanges, savePreferencesMutation]);

  // Trigger auto-save when form values change
  useEffect(() => {
    if (preferences) { // Only auto-save after initial load
      setPendingChanges(true);
      debouncedSave();
    }
  }, [defaultCurrency, defaultWallet, pdfTemplateOptions, enableNotifications, autoBackup, debouncedSave, preferences]);

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

  const handlePdfTemplateOptionsChange = (values: string[]) => {
    setPdfTemplateOptions(values);
  };

  const handleNotificationsChange = (checked: boolean) => {
    setEnableNotifications(checked);
  };

  const handleAutoBackupChange = (checked: boolean) => {
    setAutoBackup(checked);
  };

  if (isLoadingPreferences) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando preferencias...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Configuración de Finanzas</h1>
          <p className="text-sm text-muted-foreground">
            Configura las preferencias financieras de tu organización
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Titles and Descriptions */}
          <div className="space-y-12">
            {/* Financial Preferences Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <h2 className="text-lg font-semibold">Preferencias Financieras</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Configura las opciones predeterminadas para las operaciones financieras
              </p>
            </div>

            {/* Notifications Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <h2 className="text-lg font-semibold">Notificaciones</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Controla qué notificaciones financieras quieres recibir
              </p>
            </div>

            {/* Movement Concepts Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tags className="w-4 h-4" />
                <h2 className="text-lg font-semibold">Conceptos de Movimiento</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Gestiona los conceptos utilizados para categorizar tus movimientos financieros
              </p>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-8">
            {/* Financial Preferences */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-currency" className="required-asterisk">Moneda por defecto</Label>
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
                <Label htmlFor="default-wallet" className="required-asterisk">Cartera por defecto</Label>
                <Select value={defaultWallet} onValueChange={handleWalletChange}>
                  <SelectTrigger id="default-wallet">
                    <SelectValue placeholder="Selecciona una cartera" />
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
                <Label htmlFor="pdf-templates">Plantillas PDF disponibles</Label>
                <CustomMultiComboBox
                  options={[
                    { value: 'invoice', label: 'Factura estándar' },
                    { value: 'receipt', label: 'Recibo simple' },
                    { value: 'detailed', label: 'Reporte detallado' },
                    { value: 'summary', label: 'Resumen financiero' },
                  ]}
                  selectedValues={pdfTemplateOptions}
                  onChange={handlePdfTemplateOptionsChange}
                  placeholder="Selecciona plantillas PDF"
                  searchPlaceholder="Buscar plantillas..."
                />
              </div>
            </div>

            <Separator />

            {/* Notifications Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-notifications"
                  checked={enableNotifications}
                  onCheckedChange={handleNotificationsChange}
                />
                <Label htmlFor="enable-notifications">Habilitar notificaciones financieras</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-backup"
                  checked={autoBackup}
                  onCheckedChange={handleAutoBackupChange}
                />
                <Label htmlFor="auto-backup">Respaldo automático de datos financieros</Label>
              </div>
            </div>

            <Separator />

            {/* Movement Concepts */}
            <div className="space-y-4">
              <CustomMovementConcepts />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}