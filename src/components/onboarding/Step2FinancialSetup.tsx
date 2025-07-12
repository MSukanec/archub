import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomMultiComboBox } from "@/components/ui-custom/misc/CustomMultiComboBox";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useCurrencies } from "@/hooks/use-currencies";
import { useAllWallets } from "@/hooks/use-wallets";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Coins, ArrowLeft, Wallet, HelpCircle } from "lucide-react";
import { HelpPopover } from "@/components/ui-custom/HelpPopover";

export function Step2FinancialSetup() {
  const { data: userData } = useCurrentUser();
  const { data: allCurrencies } = useCurrencies();
  const { data: allWallets } = useAllWallets();
  const { 
    formData, 
    updateFormData, 
    goNextStep, 
    goPrevStep 
  } = useOnboardingStore();

  // Local states for form validation
  const [defaultCurrency, setDefaultCurrency] = useState(formData.default_currency_id || '');
  const [secondaryCurrencies, setSecondaryCurrencies] = useState<string[]>(formData.secondary_currency_ids || []);
  const [defaultWallet, setDefaultWallet] = useState(formData.default_wallet_id || '');
  const [secondaryWallets, setSecondaryWallets] = useState<string[]>(formData.secondary_wallet_ids || []);

  // Available options for secondary selections (exclude defaults)
  const availableSecondaryCurrencies = allCurrencies?.filter(c => c.id !== defaultCurrency) || [];
  const availableSecondaryWallets = allWallets?.filter(w => w.id !== defaultWallet) || [];

  const handleNext = () => {
    // Update formData with current values
    updateFormData({
      default_currency_id: defaultCurrency,
      secondary_currency_ids: secondaryCurrencies,
      default_wallet_id: defaultWallet,
      secondary_wallet_ids: secondaryWallets,
    });
    goNextStep();
  };

  const handleDefaultCurrencyChange = (currencyId: string) => {
    setDefaultCurrency(currencyId);
    // Remove from secondary if it was there
    setSecondaryCurrencies(prev => prev.filter(id => id !== currencyId));
  };

  const handleDefaultWalletChange = (walletId: string) => {
    setDefaultWallet(walletId);
    // Remove from secondary if it was there
    setSecondaryWallets(prev => prev.filter(id => id !== walletId));
  };

  const isValid = defaultCurrency && defaultWallet;

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full">
            <Coins className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Configuración Financiera
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Configura las monedas y billeteras que utilizará tu organización por defecto
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Monedas Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Monedas y Billetes</h3>
              <HelpPopover
                content="Configura las monedas que utilizas frecuentemente en tu organización"
                title="Configuración de Monedas"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </HelpPopover>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Currency */}
              <div className="space-y-2">
                <Label htmlFor="default-currency" className="text-sm font-medium text-foreground">
                  Moneda por Defecto <span className="text-accent">*</span>
                </Label>
                <Select value={defaultCurrency} onValueChange={handleDefaultCurrencyChange}>
                  <SelectTrigger className="bg-background">
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

              {/* Secondary Currencies */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Monedas Secundarias
                </Label>
                <CustomMultiComboBox
                  options={availableSecondaryCurrencies.map(currency => ({
                    value: currency.id,
                    label: `${currency.name} (${currency.symbol})`
                  }))}
                  values={secondaryCurrencies}
                  onValuesChange={setSecondaryCurrencies}
                  placeholder="Selecciona monedas adicionales"
                  searchPlaceholder="Buscar monedas..."
                  emptyText="No se encontraron monedas"
                />
              </div>
            </div>
          </div>

          {/* Wallets Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Billeteras</h3>
              <HelpPopover
                content="Configura las billeteras que utilizas para gestionar tus movimientos financieros"
                title="Configuración de Billeteras"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </HelpPopover>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Wallet */}
              <div className="space-y-2">
                <Label htmlFor="default-wallet" className="text-sm font-medium text-foreground">
                  Billetera por Defecto <span className="text-accent">*</span>
                </Label>
                <Select value={defaultWallet} onValueChange={handleDefaultWalletChange}>
                  <SelectTrigger className="bg-background">
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

              {/* Secondary Wallets */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Billeteras Secundarias
                </Label>
                <CustomMultiComboBox
                  options={availableSecondaryWallets.map(wallet => ({
                    value: wallet.id,
                    label: wallet.name
                  }))}
                  values={secondaryWallets}
                  onValuesChange={setSecondaryWallets}
                  placeholder="Selecciona billeteras adicionales"
                  searchPlaceholder="Buscar billeteras..."
                  emptyText="No se encontraron billeteras"
                />
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={goPrevStep}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              disabled={!isValid}
              className="flex items-center gap-2"
            >
              Continuar
              <span className="text-xs opacity-70">(3/4)</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}