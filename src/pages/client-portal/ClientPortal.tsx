import { useState, useEffect, useMemo } from 'react';
import { useRoute, useSearch } from 'wouter';
import { ClientPortalLayout, useClientPortalData } from '@/features/client-portal';
import type { ClientPortalTab, ClientPortalClient } from '@/features/client-portal';
import { PortalDashboardTab } from './PortalDashboardTab';
import { PortalInstallmentsTab } from './PortalInstallmentsTab';
import { PortalPaymentsTab } from './PortalPaymentsTab';
import { PortalLogsTab } from './PortalLogsTab';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Users, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PortalSession {
  projectId: string;
  projectClientId: string;
  contactId: string;
  exp: number;
}

function getPortalSession(): PortalSession | null {
  try {
    const stored = localStorage.getItem('portal_session');
    if (!stored) return null;
    const session = JSON.parse(stored) as PortalSession;
    if (session.exp < Date.now()) {
      localStorage.removeItem('portal_session');
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export default function ClientPortal() {
  const [, params] = useRoute('/portal/:projectId');
  const projectId = params?.projectId;
  const searchString = useSearch();
  
  const [activeTab, setActiveTab] = useState<ClientPortalTab>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();

  // Check for client ID from URL params or portal session
  const clientIdFromSession = useMemo(() => {
    const urlParams = new URLSearchParams(searchString);
    const urlClientId = urlParams.get('clientId');
    if (urlClientId) return urlClientId;
    
    const session = getPortalSession();
    if (session && session.projectId === projectId) {
      return session.contactId;
    }
    return undefined;
  }, [searchString, projectId]);

  // Set initial selected client from session/URL
  useEffect(() => {
    if (clientIdFromSession && !selectedClientId) {
      setSelectedClientId(clientIdFromSession);
    }
  }, [clientIdFromSession]);

  const { data, isLoading, isFetching, error } = useClientPortalData({
    projectId: projectId || '',
    clientId: selectedClientId || clientIdFromSession,
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertCircle className="h-6 w-6" />
              <h2 className="font-semibold">Error al cargar</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : 'No se pudieron cargar los datos del portal.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getClientDisplayName = (client: ClientPortalClient) => {
    if (client.full_name) return client.full_name;
    if (client.first_name || client.last_name) {
      return `${client.first_name || ''} ${client.last_name || ''}`.trim();
    }
    return client.email || 'Cliente sin nombre';
  };

  const renderTabContent = () => {
    const { settings } = data;
    
    switch (activeTab) {
      case 'dashboard':
        return settings.show_dashboard ? <PortalDashboardTab data={data} /> : null;
      case 'installments':
        return settings.show_installments ? <PortalInstallmentsTab data={data} /> : null;
      case 'payments':
        return settings.show_payments ? <PortalPaymentsTab data={data} /> : null;
      case 'logs':
        return settings.show_logs ? <PortalLogsTab data={data} /> : null;
      default:
        return null;
    }
  };

  return (
    <ClientPortalLayout
      project={data.project}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isAdminPreview={data.is_admin_preview}
      settings={data.settings}
      adminPreviewSlot={
        data.is_admin_preview && data.clients.length > 1 ? (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedClientId || data.client?.id || ''}
              onValueChange={(value) => setSelectedClientId(value)}
            >
              <SelectTrigger 
                className="w-[200px] h-8 text-xs"
                data-testid="select-client-preview"
              >
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {data.clients.map((client) => (
                  <SelectItem 
                    key={client.id} 
                    value={client.id}
                    data-testid={`select-client-${client.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{getClientDisplayName(client)}</span>
                      {client.unit && (
                        <span className="text-muted-foreground">({client.unit})</span>
                      )}
                      {client.is_primary && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          Principal
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        ) : null
      }
    >
      {renderTabContent()}
    </ClientPortalLayout>
  );
}
