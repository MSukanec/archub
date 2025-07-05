import { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomMultiComboBox } from '@/components/ui-custom/misc/CustomMultiComboBox';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrencies } from '@/hooks/use-currencies';
import { useWallets } from '@/hooks/use-wallets';
import { useNavigationStore } from '@/stores/navigationStore';

export default function FinancesPreferences() {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { data: currencies } = useCurrencies();
  const { data: wallets } = useWallets();

  // Form states - using local state since organization_preferences table doesn't exist yet
  const [defaultCurrency, setDefaultCurrency] = useState<string>('');
  const [secondaryCurrencies, setSecondaryCurrencies] = useState<string[]>([]);
  const [defaultWallet, setDefaultWallet] = useState<string>('');
  const [secondaryWallets, setSecondaryWallets] = useState<string[]>([]);

  // Set sidebar context on component mount
  useEffect(() => {
    setSidebarContext('finances');
  }, [setSidebarContext]);

  // Initialize with first available currency and wallet as defaults
  useEffect(() => {
    if (currencies && currencies.length > 0 && !defaultCurrency) {
      // Find ARS currency or use first one
      const arsCurrency = currencies.find(c => c.code === 'ARS');
      setDefaultCurrency(arsCurrency?.id || currencies[0].id);
    }
  }, [currencies, defaultCurrency]);

  useEffect(() => {
    if (wallets && wallets.length > 0 && !defaultWallet) {
      setDefaultWallet(wallets[0].id);
    }
  }, [wallets, defaultWallet]);

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
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-8">
            {/* Monedas y Billeteras */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-currency">Moneda por Defecto</Label>
                <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
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
                  onValuesChange={setSecondaryCurrencies}
                  placeholder="Selecciona monedas secundarias"
                  searchPlaceholder="Buscar monedas..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-wallet">Billetera por Defecto</Label>
                <Select value={defaultWallet} onValueChange={setDefaultWallet}>
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
                  onValuesChange={setSecondaryWallets}
                  placeholder="Selecciona billeteras secundarias"
                  searchPlaceholder="Buscar billeteras..."
                />
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Los cambios en las preferencias financieras se aplicarán en futuras actualizaciones. 
                Actualmente puedes visualizar y seleccionar las monedas y billeteras disponibles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}