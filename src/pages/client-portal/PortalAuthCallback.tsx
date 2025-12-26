import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
interface TokenVerification {
  valid: boolean;
  projectId: string;
  projectClientId: string;
  contactId: string;
  projectName: string;
}
export default function PortalAuthCallback() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [status, setStatus] = useState<'verifying'| 'success'| 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [projectData, setProjectData] = useState<TokenVerification | null>(null);
  useEffect(() => {
    const verifyToken = async () => {
      const params = new URLSearchParams(searchString);
      const token = params.get('token');
      if (!token) {
        setStatus('error');
        setErrorMessage('No se proporcionó un token de acceso válido.');
        return;
      }
      try {
        const response = await fetch(`/api/client-portal/verify-token?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        if (!response.ok || !data.valid) {
          setStatus('error');
          setErrorMessage(data.error || 'El enlace de acceso ha expirado o es inválido.');
          return;
        }
        setProjectData(data);
        setStatus('success');
        // Store session in localStorage for portal access (30 days)
        const session = {
          projectId: data.projectId,
          projectClientId: data.projectClientId,
          contactId: data.contactId,
          exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
        };
        localStorage.setItem('portal_session', JSON.stringify(session));
        // Redirect to portal after a brief delay
        setTimeout(() => {
          navigate(`/portal/${data.projectId}?clientId=${data.contactId}`);
        }, 2000);
      } catch (error) {
        console.error('Token verification error:', error);
        setStatus('error');
        setErrorMessage('Error al verificar el acceso. Intenta de nuevo más tarde.');
      }
    };
    verifyToken();
  }, [searchString, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Portal de Clientes</CardTitle>
          <CardDescription>
            Acceso a la información de tu proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'verifying'&& (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground text-center">
                Verificando tu acceso...
              </p>
            </>
          )}
          {status === 'success'&& projectData && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div className="text-center space-y-2">
                <p className="font-medium">¡Acceso verificado!</p>
                <p className="text-muted-foreground">
                  Redirigiendo al portal de <strong>{projectData.projectName}</strong>...
                </p>
              </div>
            </>
          )}
          {status === 'error'&& (
            <>
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="text-center space-y-2">
                <p className="font-medium text-destructive">Error de acceso</p>
                <p className="text-muted-foreground">{errorMessage}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = 'https://seencel.com'}
                className="mt-4"
              >
                Ir a Seencel
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
