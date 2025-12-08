import { useState, useEffect } from 'react';
import { Mail, RefreshCw, Copy, Check } from 'lucide-react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailPreview {
  type: 'registration' | 'purchase' | 'bank-transfer-admin' | 'invitation' | 'transfer-pending';
  html: string;
  preview: {
    subject: string;
    from: string;
    to: string;
  };
}

interface Course {
  id: string;
  title: string;
  price: number;
}

function EmailTemplatesContent() {
  const [registrationEmail, setRegistrationEmail] = useState<EmailPreview | null>(null);
  const [purchaseEmail, setPurchaseEmail] = useState<EmailPreview | null>(null);
  const [transferPendingEmail, setTransferPendingEmail] = useState<EmailPreview | null>(null);
  const [bankTransferAdminEmail, setBankTransferAdminEmail] = useState<EmailPreview | null>(null);
  const [invitationEmail, setInvitationEmail] = useState<EmailPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  // Editable fields for registration email
  const [regUserName, setRegUserName] = useState('Jorge Benitest');
  const [regAdminName, setRegAdminName] = useState('Matías - Seencel');

  // Editable fields for purchase email
  const [purUserName, setPurUserName] = useState('Jorge Benitest');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Editable fields for invitation email
  const [invOrganizationName, setInvOrganizationName] = useState('Constructora ABC');
  const [invInviterName, setInvInviterName] = useState('Juan Pérez');
  const [invRoleName, setInvRoleName] = useState('Miembro');
  const [invInviteeEmail, setInvInviteeEmail] = useState('invitado@example.com');

  useEffect(() => {
    loadCourses();
    loadEmails();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses-for-preview');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedCourseId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadEmails = async () => {
    setLoading(true);
    try {
      const regRes = await fetch('/api/admin/email-preview/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: regUserName,
          userEmail: 'usuario@example.com',
          adminName: regAdminName,
        })
      });
      if (regRes.ok) {
        const data = await regRes.json();
        setRegistrationEmail(data);
      }

      const purRes = await fetch('/api/admin/email-preview/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: purUserName,
          courseId: selectedCourseId || undefined,
        })
      });
      if (purRes.ok) {
        const data = await purRes.json();
        setPurchaseEmail(data);
      }

      const tpRes = await fetch('/api/admin/email-preview/transfer-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: 'Jorge Benitest',
          courseName: 'Curso Avanzado de Construcción',
          amount: '$85,000 ARS',
          transferId: 'TRF-20241128-001',
        })
      });
      if (tpRes.ok) {
        const data = await tpRes.json();
        setTransferPendingEmail(data);
      }

      const btaRes = await fetch('/api/admin/email-preview/bank-transfer-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: 'Juan Pérez',
          userEmail: 'juan.perez@example.com',
          courseName: 'Curso de Gestión de Proyectos',
          amount: '85000',
          currency: 'ARS',
          transferId: 'btp-preview-001',
        })
      });
      if (btaRes.ok) {
        const data = await btaRes.json();
        setBankTransferAdminEmail(data);
      }

      const invRes = await fetch('/api/admin/email-preview/invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteeEmail: invInviteeEmail,
          organizationName: invOrganizationName,
          inviterName: invInviterName,
          roleName: invRoleName,
          adminName: 'El Equipo de Seencel',
        })
      });
      if (invRes.ok) {
        const data = await invRes.json();
        setInvitationEmail(data);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  const RegistrationEmailEditor = () => (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
        <CardHeader>
          <CardTitle className="text-base">Personalizar Email de Registro</CardTitle>
          <CardDescription>Edita los campos para ver cómo se verá el email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nombre del Usuario</label>
            <Input 
              value={regUserName} 
              onChange={(e) => setRegUserName(e.target.value)}
              placeholder="Ej: Jorge Benitest"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tu Nombre / Firma</label>
            <Input 
              value={regAdminName} 
              onChange={(e) => setRegAdminName(e.target.value)}
              placeholder="Ej: Matías - Seencel"
              className="mt-1"
            />
          </div>
          <Button 
            onClick={loadEmails} 
            disabled={loading}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Vista Previa
          </Button>
        </CardContent>
      </Card>

      {registrationEmail && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Asunto
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(registrationEmail.preview.subject, 'reg-subject')}
                >
                  {copiedCode === 'reg-subject' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-mono">{registrationEmail.preview.subject}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vista Previa del Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={registrationEmail.html}
                  title="Email Preview"
                  className="w-full h-[500px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const PurchaseEmailEditor = () => (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
        <CardHeader>
          <CardTitle className="text-base">Personalizar Email de Compra</CardTitle>
          <CardDescription>Selecciona un curso y personaliza el cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Seleccionar Curso</label>
            <Select value={selectedCourseId} onValueChange={(value) => {
              setSelectedCourseId(value);
            }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona un curso..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title} - ${course.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourse && (
            <>
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                <p className="text-sm"><strong>Curso:</strong> {selectedCourse.title}</p>
                <p className="text-sm"><strong>Monto:</strong> ${selectedCourse.price}</p>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium">Nombre del Cliente</label>
            <Input 
              value={purUserName} 
              onChange={(e) => setPurUserName(e.target.value)}
              placeholder="Ej: Jorge Benitest"
              className="mt-1"
            />
          </div>

          <Button 
            onClick={loadEmails} 
            disabled={loading}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Vista Previa
          </Button>
        </CardContent>
      </Card>

      {purchaseEmail && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Asunto
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(purchaseEmail.preview.subject, 'pur-subject')}
                >
                  {copiedCode === 'pur-subject' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-mono">{purchaseEmail.preview.subject}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vista Previa del Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={purchaseEmail.html}
                  title="Email Preview"
                  className="w-full h-[500px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const TransferPendingEmailEditor = () => (
    <div className="space-y-4">
      {transferPendingEmail && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Asunto
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(transferPendingEmail.preview.subject, 'tp-subject')}
                >
                  {copiedCode === 'tp-subject' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-mono">{transferPendingEmail.preview.subject}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vista Previa del Email</CardTitle>
              <CardDescription>Este email se envía al usuario cuando sube un comprobante de transferencia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={transferPendingEmail.html}
                  title="Email Preview"
                  className="w-full h-[600px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const BankTransferAdminEmailEditor = () => (
    <div className="space-y-4">
      {bankTransferAdminEmail && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Asunto
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankTransferAdminEmail.preview.subject, 'bta-subject')}
                >
                  {copiedCode === 'bta-subject' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-mono">{bankTransferAdminEmail.preview.subject}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vista Previa del Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={bankTransferAdminEmail.html}
                  title="Email Preview"
                  className="w-full h-[600px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const InvitationEmailEditor = () => (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/30">
        <CardHeader>
          <CardTitle className="text-base">Personalizar Email de Invitación</CardTitle>
          <CardDescription>Este email se envía cuando invitas a un usuario que NO tiene cuenta en Seencel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nombre de la Organización</label>
            <Input 
              value={invOrganizationName} 
              onChange={(e) => setInvOrganizationName(e.target.value)}
              placeholder="Ej: Constructora ABC"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Nombre de quien invita</label>
            <Input 
              value={invInviterName} 
              onChange={(e) => setInvInviterName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Rol asignado</label>
            <Input 
              value={invRoleName} 
              onChange={(e) => setInvRoleName(e.target.value)}
              placeholder="Ej: Miembro"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email del invitado</label>
            <Input 
              value={invInviteeEmail} 
              onChange={(e) => setInvInviteeEmail(e.target.value)}
              placeholder="Ej: invitado@example.com"
              className="mt-1"
            />
          </div>
          <Button 
            onClick={loadEmails} 
            disabled={loading}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Vista Previa
          </Button>
        </CardContent>
      </Card>

      {invitationEmail && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Asunto
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(invitationEmail.preview.subject, 'inv-subject')}
                >
                  {copiedCode === 'inv-subject' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-mono">{invitationEmail.preview.subject}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vista Previa del Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={invitationEmail.html}
                  title="Email Preview"
                  className="w-full h-[600px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="registration" className="w-full">
        <TabsList className="w-full justify-start flex-wrap">
          <TabsTrigger value="registration" data-testid="tab-registration-email">✉️ Registro</TabsTrigger>
          <TabsTrigger value="purchase" data-testid="tab-purchase-email">💳 Compra</TabsTrigger>
          <TabsTrigger value="invitation" data-testid="tab-invitation-email">👥 Invitación</TabsTrigger>
          <TabsTrigger value="transfer-pending" data-testid="tab-transfer-pending-email">⏳ Pendiente</TabsTrigger>
          <TabsTrigger value="bank-transfer-admin" data-testid="tab-bank-transfer-admin-email">🏦 Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="registration" className="mt-6">
          <RegistrationEmailEditor />
        </TabsContent>

        <TabsContent value="purchase" className="mt-6">
          <PurchaseEmailEditor />
        </TabsContent>

        <TabsContent value="invitation" className="mt-6">
          <InvitationEmailEditor />
        </TabsContent>

        <TabsContent value="transfer-pending" className="mt-6">
          <TransferPendingEmailEditor />
        </TabsContent>

        <TabsContent value="bank-transfer-admin" className="mt-6">
          <BankTransferAdminEmailEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const EmailTemplatesAdmin = () => {
  const headerProps = {
    title: 'Plantillas de Email',
    icon: Mail,
    showSearch: false,
    showFilters: false,
  };

  return (
    <Layout wide headerProps={headerProps}>
      <EmailTemplatesContent />
    </Layout>
  );
};

export default EmailTemplatesAdmin;
