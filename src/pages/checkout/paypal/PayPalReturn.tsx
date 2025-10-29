import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

export default function PayPalReturn() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [courseSlug, setCourseSlug] = useState('');

  // Remove initial loader cuando el componente se monta
  useEffect(() => {
    const initialLoader = document.getElementById('initial-loader');
    if (initialLoader) {
      initialLoader.classList.add('fade-out');
      setTimeout(() => {
        initialLoader.remove();
      }, 300);
    }
  }, []);

  useEffect(() => {
    const capturePayment = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const slug = params.get('courseSlug') || 'master-archicad';
        
        setCourseSlug(slug);

        if (!token) {
          throw new Error('No se encontró el token de PayPal');
        }

        const res = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: token }),
        });

        const text = await res.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          data = { ok: false, error: text };
        }

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || `Error HTTP ${res.status}`);
        }

        setStatus('success');

        setTimeout(() => {
          setLocation(`/learning/courses/${slug}`);
        }, 3000);
      } catch (error: any) {
        console.error('Error capturando pago:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Error procesando el pago');
      }
    };

    capturePayment();
  }, [setLocation]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <CardTitle>Procesando tu pago</CardTitle>
            <CardDescription>
              Estamos confirmando tu pago con PayPal. Por favor espera...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-green-600 dark:text-green-400">¡Pago exitoso!</CardTitle>
            <CardDescription>
              Tu pago ha sido procesado correctamente. Redirigiendo al curso...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => setLocation(`/learning/courses/${courseSlug}`)}
              className="w-full"
              data-testid="button-go-to-course"
            >
              Ir al curso ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Error al procesar el pago</CardTitle>
          <CardDescription>
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => setLocation(`/learning/courses/${courseSlug || 'master-archicad'}`)}
            className="w-full"
            data-testid="button-retry"
          >
            Reintentar
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
