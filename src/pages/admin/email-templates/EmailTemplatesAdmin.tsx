import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/layouts/admin/AdminLayout';

interface EmailPreview {
  type: 'registration' | 'purchase';
  html: string;
  preview: {
    subject: string;
    from: string;
    to: string;
  };
}

function EmailTemplatesContent() {
  const [registrationEmail, setRegistrationEmail] = useState<EmailPreview | null>(null);
  const [purchaseEmail, setPurchaseEmail] = useState<EmailPreview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const regRes = await fetch('/api/admin/email-preview/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: 'Jorge Benitest',
          userEmail: 'jorge@example.com'
        })
      });
      if (regRes.ok) {
        setRegistrationEmail(await regRes.json());
      }

      const purRes = await fetch('/api/admin/email-preview/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: 'Jorge Benitest',
          courseName: 'Curso Avanzado de Construcción',
          amount: '$99.99',
          transactionId: 'TXN-20241128-001'
        })
      });
      if (purRes.ok) {
        setPurchaseEmail(await purRes.json());
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const EmailPreviewCard = ({ email }: { email: EmailPreview | null }) => {
    if (!email) return <div className="text-center py-8 text-muted-foreground">Cargando...</div>;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Información del Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Asunto</label>
              <p className="text-sm text-muted-foreground mt-1">{email.preview.subject}</p>
            </div>
            <div>
              <label className="text-sm font-medium">De</label>
              <p className="text-sm text-muted-foreground mt-1">{email.preview.from}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Para</label>
              <p className="text-sm text-muted-foreground mt-1">{email.preview.to}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
            <CardDescription>Así se verá el email en cliente de correo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-white overflow-auto max-h-[600px]">
              <iframe
                srcDoc={email.html}
                title="Email Preview"
                className="w-full h-[600px] border-0"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plantillas de Email</h1>
          <p className="text-muted-foreground mt-1">Previsualiza y gestiona tus plantillas de correo electrónico</p>
        </div>
        <Button
          onClick={loadEmails}
          disabled={loading}
          variant="outline"
          size="sm"
          data-testid="button-refresh-emails"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Recargar
        </Button>
      </div>

      <Tabs defaultValue="registration" className="w-full">
        <TabsList>
          <TabsTrigger value="registration" data-testid="tab-registration-email">Email de Registro</TabsTrigger>
          <TabsTrigger value="purchase" data-testid="tab-purchase-email">Email de Compra</TabsTrigger>
        </TabsList>

        <TabsContent value="registration" className="mt-6">
          <EmailPreviewCard email={registrationEmail} />
        </TabsContent>

        <TabsContent value="purchase" className="mt-6">
          <EmailPreviewCard email={purchaseEmail} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function EmailTemplatesAdmin() {
  return (
    <AdminLayout>
      <EmailTemplatesContent />
    </AdminLayout>
  );
}

export default EmailTemplatesAdmin;
