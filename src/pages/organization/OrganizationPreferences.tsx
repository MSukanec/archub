import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function OrganizationPreferences() {
  const { data: userData } = useCurrentUser();
  const [defaultCurrency, setDefaultCurrency] = useState('');
  const [defaultWallet, setDefaultWallet] = useState('');

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Preferencias de Organización</h1>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>

        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Financiera</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="default-currency">Moneda por defecto</Label>
                <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ars">Peso Argentino (ARS)</SelectItem>
                    <SelectItem value="usd">Dólar Estadounidense (USD)</SelectItem>
                    <SelectItem value="eur">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="default-wallet">Billetera por defecto</Label>
                <Select value={defaultWallet} onValueChange={setDefaultWallet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar billetera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="bank">Cuenta Bancaria</SelectItem>
                    <SelectItem value="credit">Tarjeta de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configuraciones adicionales estarán disponibles próximamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}