import { useState } from 'react';
import { useRoute } from 'wouter';
import { 
  ClientPortalLayout, 
  ProjectOverviewCard, 
  PaymentsList, 
  UpcomingInstallments, 
  SiteLogsFeed 
} from '@/features/client-portal';
import type { 
  ClientPortalTab, 
  ClientPortalProject, 
  ClientPortalPayment, 
  ClientPortalSchedule, 
  ClientPortalSiteLog,
  ClientPortalStats 
} from '@/features/client-portal';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function ClientPortal() {
  const [, params] = useRoute('/portal/:projectId');
  const projectId = params?.projectId;
  
  const [activeTab, setActiveTab] = useState<ClientPortalTab>('dashboard');

  const mockProject: ClientPortalProject = {
    id: projectId || '1',
    name: 'Residencial Los Álamos',
    status: 'En construcción',
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    city: 'Buenos Aires',
    country: 'Argentina',
    start_date: '2024-01-15',
    estimated_end: '2025-06-30',
    project_type_name: 'Residencial',
    project_modality_name: 'Construcción Nueva',
  };

  const mockStats: ClientPortalStats = {
    total_commitment: 15000000,
    total_paid: 9000000,
    total_pending: 6000000,
    next_due_date: '2024-02-15',
    next_due_amount: 1500000,
    currency_code: 'ARS',
  };

  const mockPayments: ClientPortalPayment[] = [
    { id: '1', amount: 3000000, currency_code: 'ARS', payment_date: '2024-01-15', status: 'confirmed', reference: 'TRF-001' },
    { id: '2', amount: 3000000, currency_code: 'ARS', payment_date: '2024-02-15', status: 'confirmed', reference: 'TRF-002' },
    { id: '3', amount: 3000000, currency_code: 'ARS', payment_date: '2024-03-15', status: 'confirmed', reference: 'TRF-003' },
  ];

  const mockSchedules: ClientPortalSchedule[] = [
    { id: '1', amount: 1500000, currency_code: 'ARS', due_date: '2024-04-15', status: 'pending' },
    { id: '2', amount: 1500000, currency_code: 'ARS', due_date: '2024-05-15', status: 'pending' },
    { id: '3', amount: 1500000, currency_code: 'ARS', due_date: '2024-06-15', status: 'pending' },
    { id: '4', amount: 1500000, currency_code: 'ARS', due_date: '2024-07-15', status: 'pending' },
  ];

  const mockLogs: ClientPortalSiteLog[] = [
    {
      id: '1',
      log_date: '2024-03-20',
      weather: 'sunny',
      entry_type_name: 'Avance de obra',
      ai_summary: 'Se completó la instalación de las estructuras metálicas del segundo piso. El avance general del proyecto es del 45%.',
      comments: 'Hoy se terminaron de soldar las vigas principales del segundo nivel. El equipo trabajó con normalidad y sin contratiempos.',
      images: [
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400',
      ],
    },
    {
      id: '2',
      log_date: '2024-03-18',
      weather: 'cloudy',
      entry_type_name: 'Inspección',
      ai_summary: 'Inspección de calidad aprobada para los trabajos de mampostería del primer piso.',
      comments: 'Se realizó la inspección técnica de los trabajos de mampostería. Todos los muros cumplen con las especificaciones del proyecto.',
    },
    {
      id: '3',
      log_date: '2024-03-15',
      weather: 'sunny',
      entry_type_name: 'Avance de obra',
      ai_summary: 'Inicio de trabajos de instalaciones eléctricas en planta baja.',
      comments: 'El equipo de electricistas comenzó con el tendido de cañerías para la instalación eléctrica. Se estima completar la planta baja en 5 días.',
      images: [
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
      ],
    },
  ];

  if (!projectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h2 className="font-semibold">Proyecto no encontrado</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              No se pudo identificar el proyecto. Por favor verifica el enlace de acceso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ProjectOverviewCard 
            project={mockProject} 
            stats={mockStats} 
          />
        );
      case 'payments':
        return (
          <div className="space-y-6">
            <UpcomingInstallments schedules={mockSchedules} />
            <PaymentsList payments={mockPayments} />
          </div>
        );
      case 'logs':
        return <SiteLogsFeed logs={mockLogs} />;
      default:
        return null;
    }
  };

  return (
    <ClientPortalLayout
      project={mockProject}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderTabContent()}
    </ClientPortalLayout>
  );
}
