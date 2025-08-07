import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComboBoxMultiSelect } from "@/components/ui-custom/ComboBoxMultiSelect";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useCurrencies } from "@/hooks/use-currencies";
import { useAllWallets } from "@/hooks/use-wallets";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationCurrencies } from "@/hooks/use-currencies";
import { useWallets } from "@/hooks/use-wallets";
import { Coins, ArrowLeft } from "lucide-react";
import { HelpPopover } from "@/components/ui-custom/HelpPopover";

export function Step2FinancialSetup() {
  const { data: userData } = useCurrentUser();
  const { data: allCurrencies } = useCurrencies();
  const { data: allWallets } = useAllWallets();
  const { data: orgCurrencies } = useOrganizationCurrencies(userData?.organization?.id);
  const { data: orgWallets } = useWallets(userData?.organization?.id);
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

  // Load existing financial preferences
  useEffect(() => {
    if (orgCurrencies && orgWallets && userData?.organization?.id) {
      // For currencies: find default from organization_currencies
      const defaultCurr = orgCurrencies.find((oc: any) => oc.currency)?.currency?.id || '';
      const secondaryCurr = orgCurrencies.filter((oc: any) => oc.currency && oc.currency.id !== defaultCurr).map((oc: any) => oc.currency.id);
      
      // For wallets: find default from organization_wallets
      const defaultWall = orgWallets.find((ow: any) => ow.is_default && ow.wallets)?.wallets?.id || '';
      const secondaryWall = orgWallets.filter((ow: any) => !ow.is_default && ow.wallets).map((ow: any) => ow.wallets.id);
      
      setDefaultCurrency(defaultCurr);
      setSecondaryCurrencies(secondaryCurr);
      setDefaultWallet(defaultWall);
      setSecondaryWallets(secondaryWall);
      
      updateFormData({
        default_currency_id: defaultCurr,
        secondary_currency_ids: secondaryCurr,
        default_wallet_id: defaultWall,
        secondary_wallet_ids: secondaryWall,
      });
    }
  }, [orgCurrencies, orgWallets, userData?.organization?.id, updateFormData]);

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

  const isValid = formData.organization_name && defaultCurrency && defaultWallet;

  return (
          </div>
        </div>
          Define el nombre de tu organización y sus preferencias financieras iniciales.
        </CardDescription>
      </CardHeader>

        {/* Nombre de Organización */}
            <HelpPopover
              description="El nombre de tu empresa o estudio será visible en reportes, presupuestos y documentación oficial. Asegúrate de usar el nombre legal completo."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
          <Input
            id="organization_name"
            placeholder="Nombre de tu organización"
            value={formData.organization_name}
            onChange={(e) => updateFormData({ organization_name: e.target.value })}
          />
        </div>

        {/* Moneda por Defecto */}
            <HelpPopover
              description="La moneda principal que utilizarás para la mayoría de tus transacciones y reportes financieros."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
          <Select value={defaultCurrency} onValueChange={handleDefaultCurrencyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona moneda principal" />
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

        {/* Monedas Secundarias */}
            <Label>Monedas Secundarias</Label>
            <HelpPopover
              description="Otras monedas que puedes utilizar ocasionalmente en tu organización."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
          <ComboBoxMultiSelect
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

        {/* Billetera por Defecto */}
            <HelpPopover
              description="La cuenta o método de pago principal que utilizarás para la mayoría de tus transacciones."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
          <Select value={defaultWallet} onValueChange={handleDefaultWalletChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona billetera principal" />
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

        {/* Billeteras Secundarias */}
            <Label>Billeteras Secundarias</Label>
            <HelpPopover
              description="Otras cuentas o métodos de pago que puedes utilizar ocasionalmente."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
          <ComboBoxMultiSelect
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

          <Button 
            onClick={goPrevStep}
            variant="outline"
          >
            Volver
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!isValid}
          >
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}