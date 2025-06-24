import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Settings, Save } from 'lucide-react';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrencies } from '@/hooks/use-currencies';
import { useWallets } from '@/hooks/use-wallets';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
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

interface OrganizationCurrency {
  id: string;
  organization_id: string;
  currency_id: string;
  is_default: boolean;
  created_at: string;
}

interface OrganizationWallet {
  id: string;
  organization_id: string;
  wallet_id: string;
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
  const [defaultPdfTemplate, setDefaultPdfTemplate] = useState('none');
  const [secondaryCurrencies, setSecondaryCurrencies] = useState<string[]>([]);
  const [secondaryWallets, setSecondaryWallets] = useState<string[]>([]);

  const { setSidebarContext } = useNavigationStore();
  const { toast } = useToast();

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
      console.log('Fetching currencies...');
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching currencies:', error);
        throw error;
      }
      
      console.log('Currencies fetched:', data);
      return data as Currency[];
    },
  });

  // Fetch all wallets (not organization-specific based on schema)
  const { data: allWallets = [] } = useWallets(organizationId);

  // Fetch organization preferences
  const { data: orgPreferences } = useQuery({
    queryKey: ['organization-preferences', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from('organization_preferences')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as OrganizationPreferences | null;
    },
    enabled: !!organizationId,
  });

  // Fetch organization currencies
  const { data: orgCurrencies = [] } = useQuery({
    queryKey: ['organization-currencies', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_currencies')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as OrganizationCurrency[];
    },
    enabled: !!organizationId,
  });

  // Fetch organization wallets
  const { data: orgWallets = [] } = useQuery({
    queryKey: ['organization-wallets', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_wallets')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as OrganizationWallet[];
    },
    enabled: !!organizationId,
  });

  // Load current preferences when data is available
  useEffect(() => {
    if (orgPreferences) {
      setDefaultCurrency(orgPreferences.default_currency_id || 'none');
      setDefaultWallet(orgPreferences.default_wallet_id || 'none');
      setDefaultPdfTemplate(orgPreferences.default_pdf_template_id || 'none');
    }
  }, [orgPreferences]);

  // Load secondary currencies and wallets
  useEffect(() => {
    const secondaries = orgCurrencies
      .filter(oc => !oc.is_default)
      .map(oc => oc.currency_id);
    setSecondaryCurrencies(secondaries);
  }, [orgCurrencies]);

  useEffect(() => {
    const secondaries = orgWallets
      .filter(ow => !ow.is_default)
      .map(ow => ow.wallet_id);
    setSecondaryWallets(secondaries);
  }, [orgWallets]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('No organization selected');

      // Save organization preferences
      const { error: prefError } = await supabase
        .from('organization_preferences')
        .upsert({
          organization_id: organizationId,
          default_currency_id: defaultCurrency === 'none' ? null : defaultCurrency,
          default_wallet_id: defaultWallet === 'none' ? null : defaultWallet,
          default_pdf_template_id: defaultPdfTemplate === 'none' ? null : defaultPdfTemplate,
        }, {
          onConflict: 'organization_id'
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

      // Add secondary currencies
      if (secondaryCurrencies.length > 0) {
        const secondaryCurrencyInserts = secondaryCurrencies.map(currencyId => ({
          organization_id: organizationId,
          currency_id: currencyId,
          is_default: false,
        }));

        const { error: secCurrError } = await supabase
          .from('organization_currencies')
          .insert(secondaryCurrencyInserts);

        if (secCurrError) throw secCurrError;
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

      // Add secondary wallets
      if (secondaryWallets.length > 0) {
        const secondaryWalletInserts = secondaryWallets.map(walletId => ({
          organization_id: organizationId,
          wallet_id: walletId,
          is_default: false,
        }));

        const { error: secWalletError } = await supabase
          .from('organization_wallets')
          .insert(secondaryWalletInserts);

        if (secWalletError) throw secWalletError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Preferencias guardadas",
        description: "Las preferencias de la organización se han actualizado correctamente.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['organization-preferences', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-currencies', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-wallets', organizationId] });
    },
    onError: (error) => {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate();
  };

  // Filter out default selections from secondary options
  const availableSecondaryCurrencies = allCurrencies.filter(c => 
    c.id !== defaultCurrency || defaultCurrency === 'none'
  );
  const availableSecondaryWallets = allWallets.filter(w => 
    w.id !== defaultWallet || defaultWallet === 'none'
  );

  const handleSecondaryCurrencyToggle = (currencyId: string) => {
    setSecondaryCurrencies(prev => 
      prev.includes(currencyId)
        ? prev.filter(id => id !== currencyId)
        : [...prev, currencyId]
    );
  };

  const handleSecondaryWalletToggle = (walletId: string) => {
    setSecondaryWallets(prev => 
      prev.includes(walletId)
        ? prev.filter(id => id !== walletId)
        : [...prev, walletId]
    );
  };

  const headerProps = {
    title: "Preferencias",
    actions: [
      <Button 
        key="save-preferences"
        onClick={handleSavePreferences}
        disabled={savePreferencesMutation.isPending}
        className="h-8"
      >
        <Save className="mr-2 h-4 w-4" />
        {savePreferencesMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    ]
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
      <div className="space-y-6">
        {/* Monedas */}
        <Card>
          <CardHeader>
            <CardTitle>Monedas</CardTitle>
            <CardDescription>
              Configura las monedas disponibles en esta organización
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-currency">Moneda por defecto</Label>
              <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
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
              <Label>Monedas secundarias</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {secondaryCurrencies.map((currencyId) => {
                    const currency = allCurrencies.find(c => c.id === currencyId);
                    return currency ? (
                      <Badge 
                        key={currencyId} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleSecondaryCurrencyToggle(currencyId)}
                      >
                        {currency.code} - {currency.name} ×
                      </Badge>
                    ) : null;
                  })}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {availableSecondaryCurrencies.map((currency) => (
                    <div 
                      key={currency.id}
                      className="p-2 border rounded cursor-pointer hover:bg-accent text-sm"
                      onClick={() => handleSecondaryCurrencyToggle(currency.id)}
                    >
                      <div className="font-medium">{currency.code}</div>
                      <div className="text-xs opacity-70">{currency.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billeteras */}
        <Card>
          <CardHeader>
            <CardTitle>Billeteras</CardTitle>
            <CardDescription>
              Configura las billeteras disponibles en esta organización
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-wallet">Billetera por defecto</Label>
              <Select value={defaultWallet} onValueChange={setDefaultWallet}>
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
              <Label>Billeteras secundarias</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {secondaryWallets.map((walletId) => {
                    const wallet = allWallets.find(w => w.id === walletId);
                    return wallet ? (
                      <Badge 
                        key={walletId} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleSecondaryWalletToggle(walletId)}
                      >
                        {wallet.name} ×
                      </Badge>
                    ) : null;
                  })}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {availableSecondaryWallets.map((wallet) => (
                    <div 
                      key={wallet.id}
                      className="p-2 border rounded cursor-pointer hover:bg-accent text-sm"
                      onClick={() => handleSecondaryWalletToggle(wallet.id)}
                    >
                      <div className="font-medium">{wallet.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plantillas */}
        <Card>
          <CardHeader>
            <CardTitle>Plantillas</CardTitle>
            <CardDescription>
              Configura las plantillas por defecto para diferentes tipos de reportes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="budget-template" className="text-sm font-medium">
                Plantilla de Cómputo y Presupuesto:
              </Label>
              <div className="w-64">
                <Select value={defaultPdfTemplate} onValueChange={setDefaultPdfTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin seleccionar</SelectItem>
                    <SelectItem value="template_1">Plantilla Estándar</SelectItem>
                    <SelectItem value="template_2">Plantilla Moderna</SelectItem>
                    <SelectItem value="template_3">Plantilla Corporativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="movements-template" className="text-sm font-medium">
                Plantilla de Movimientos:
              </Label>
              <div className="w-64">
                <Select value="none" disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Próximamente" />
                  </SelectTrigger>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sitelog-template" className="text-sm font-medium">
                Plantilla de Bitácora:
              </Label>
              <div className="w-64">
                <Select value="none" disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Próximamente" />
                  </SelectTrigger>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}