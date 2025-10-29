import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function PayPalCancel() {
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const courseSlug = params.get('courseSlug') || 'master-archicad';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>Pago cancelado</CardTitle>
          <CardDescription>
            Has cancelado el proceso de pago. No se ha realizado ningún cargo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => setLocation(`/learning/courses/${courseSlug}`)}
            className="w-full"
            data-testid="button-retry-payment"
          >
            Reintentar pago
          </Button>
          <Button
            onClick={() => setLocation('/learning')}
            variant="outline"
            className="w-full"
            data-testid="button-back-to-learning"
          >
            Volver a Capacitaciones
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
