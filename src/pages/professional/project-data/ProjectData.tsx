import { useEffect, useState, useCallback } from 'react';
import { FileText, Share2, Copy, MessageCircle, Mail, MapPin, Home, Bell, Users, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectContext } from '@/stores/projectContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetBody } from '@/components/ui/bottom-sheet';
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';
import { useLocation } from 'wouter';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import ProjectBasicDataTab from './ProjectBasicDataTab';
import ProjectLocationTab from './ProjectLocationTab';
import ProjectClientTab from './ProjectClientTab';

export default function ProjectData() {
  const [activeTab, setActiveTab] = useState('basic');
  const [showShareBottomSheet, setShowShareBottomSheet] = useState(false);
  const { setSidebarContext } = useNavigationStore();
  const { selectedProjectId } = useProjectContext();
  const { toast } = useToast();
  const { setActions, setShowActionBar, clearActions } = useActionBarMobile();
  const isMobile = useMobile();
  const [, navigate] = useLocation();
  const { openModal } = useGlobalModalStore();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  // Get project location data for sharing
  const { data: projectLocationData } = useQuery({
    queryKey: ['project-data', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('project_data')
        .select('*')
        .eq('project_id', selectedProjectId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching project data:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!selectedProjectId && !!supabase && activeTab === 'location'
  });

  // Helper functions for sharing location data (memoized)
  const copyLocationDataToClipboard = useCallback(async () => {
    if (!projectLocationData) {
      toast({
        title: "No hay datos",
        description: "No hay datos de ubicación para compartir",
        variant: "destructive"
      });
      return;
    }

    const dataText = `📍 UBICACIÓN DEL PROYECTO

Dirección: ${projectLocationData.address_full || 'No especificada'}
${projectLocationData.city ? `Ciudad: ${projectLocationData.city}\n` : ''}${projectLocationData.state ? `Provincia/Estado: ${projectLocationData.state}\n` : ''}${projectLocationData.country ? `País: ${projectLocationData.country}\n` : ''}${projectLocationData.zip_code ? `Código Postal: ${projectLocationData.zip_code}\n` : ''}
${projectLocationData.lat && projectLocationData.lng ? `Coordenadas: ${projectLocationData.lat}, ${projectLocationData.lng}\n` : ''}${projectLocationData.location_type ? `Tipo de ubicación: ${projectLocationData.location_type}\n` : ''}${projectLocationData.accessibility_notes ? `Notas de accesibilidad: ${projectLocationData.accessibility_notes}\n` : ''}
---
Generado desde Seencel`;

    try {
      await navigator.clipboard.writeText(dataText);
      toast({
        title: "Datos copiados",
        description: "Los datos de ubicación se copiaron al portapapeles"
      });
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudieron copiar los datos",
        variant: "destructive"
      });
    }
  }, [projectLocationData, toast]);

  const shareLocationViaWhatsApp = useCallback(() => {
    if (!projectLocationData) {
      toast({
        title: "No hay datos",
        description: "No hay datos de ubicación para compartir",
        variant: "destructive"
      });
      return;
    }

    const message = `📍 *UBICACIÓN DEL PROYECTO*

*Dirección:* ${projectLocationData.address_full || 'No especificada'}
${projectLocationData.city ? `*Ciudad:* ${projectLocationData.city}\n` : ''}${projectLocationData.state ? `*Provincia/Estado:* ${projectLocationData.state}\n` : ''}${projectLocationData.country ? `*País:* ${projectLocationData.country}\n` : ''}${projectLocationData.zip_code ? `*Código Postal:* ${projectLocationData.zip_code}\n` : ''}
${projectLocationData.lat && projectLocationData.lng ? `*Coordenadas:* ${projectLocationData.lat}, ${projectLocationData.lng}\n` : ''}${projectLocationData.lat && projectLocationData.lng ? `*Google Maps:* https://www.google.com/maps?q=${projectLocationData.lat},${projectLocationData.lng}\n` : ''}${projectLocationData.location_type ? `*Tipo de ubicación:* ${projectLocationData.location_type}\n` : ''}${projectLocationData.accessibility_notes ? `*Notas de accesibilidad:* ${projectLocationData.accessibility_notes}\n` : ''}
---
_Compartido desde Seencel_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  }, [projectLocationData, toast]);

  const shareLocationViaEmail = useCallback(() => {
    if (!projectLocationData) {
      toast({
        title: "No hay datos",
        description: "No hay datos de ubicación para compartir",
        variant: "destructive"
      });
      return;
    }

    const subject = encodeURIComponent('Ubicación del Proyecto');
    const body = encodeURIComponent(`UBICACIÓN DEL PROYECTO

Dirección: ${projectLocationData.address_full || 'No especificada'}
${projectLocationData.city ? `Ciudad: ${projectLocationData.city}\n` : ''}${projectLocationData.state ? `Provincia/Estado: ${projectLocationData.state}\n` : ''}${projectLocationData.country ? `País: ${projectLocationData.country}\n` : ''}${projectLocationData.zip_code ? `Código Postal: ${projectLocationData.zip_code}\n` : ''}
${projectLocationData.lat && projectLocationData.lng ? `Coordenadas: ${projectLocationData.lat}, ${projectLocationData.lng}\n` : ''}${projectLocationData.lat && projectLocationData.lng ? `Google Maps: https://www.google.com/maps?q=${projectLocationData.lat},${projectLocationData.lng}\n` : ''}${projectLocationData.location_type ? `Tipo de ubicación: ${projectLocationData.location_type}\n` : ''}${projectLocationData.accessibility_notes ? `Notas de accesibilidad: ${projectLocationData.accessibility_notes}\n` : ''}
---
Generado desde Seencel`);

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [projectLocationData, toast]);

  const openInGoogleMaps = useCallback(() => {
    if (!projectLocationData || !projectLocationData.lat || !projectLocationData.lng) {
      toast({
        title: "Sin coordenadas",
        description: "No hay coordenadas disponibles para abrir en Google Maps",
        variant: "destructive"
      });
      return;
    }

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${projectLocationData.lat},${projectLocationData.lng}`;
    window.open(mapsUrl, '_blank');
  }, [projectLocationData, toast]);

  // Mobile Action Bar handlers (memoized to prevent popover teardown)
  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleNotifications = useCallback(() => {
    // TODO: Implement notifications
    toast({
      title: "Notificaciones",
      description: "Funcionalidad en desarrollo"
    });
  }, [toast]);

  const handleShareLocation = useCallback(() => {
    setShowShareBottomSheet(true);
  }, []);

  // Configure Mobile Action Bar based on active tab
  useEffect(() => {
    if (!isMobile) return;

    const actions: Record<string, any> = {
      home: {
        id: 'home',
        icon: Home,
        label: 'Inicio',
        onClick: handleGoHome,
      },
      notifications: {
        id: 'notifications',
        icon: Bell,
        label: 'Notificaciones',
        onClick: handleNotifications,
      }
    };

    // Add share button for location tab using 'create' slot
    if (activeTab === 'location') {
      actions.create = {
        id: 'share',
        icon: Share2,
        label: 'Compartir',
        onClick: handleShareLocation,
        variant: 'primary' as const
      };
    }
    // Datos Básicos and Cliente tabs don't have action buttons (only home + notifications)

    setActions(actions);
    setShowActionBar(true);

    return () => {
      clearActions();
      setShowActionBar(false);
    };
  }, [isMobile, activeTab, handleGoHome, handleNotifications, handleShareLocation, setActions, setShowActionBar, clearActions]);

  const headerTabs = [
    {
      id: 'basic',
      label: 'Datos Básicos',
      isActive: activeTab === 'basic'
    },
    {
      id: 'location',
      label: 'Ubicación',
      isActive: activeTab === 'location'
    },
    {
      id: 'client',
      label: 'Clientes',
      isActive: activeTab === 'client'
    }
  ];

  // Share button for location tab
  const shareButton = activeTab === 'location' ? (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          className="gap-2"
          data-testid="button-share-location-data"
        >
          <Share2 className="h-4 w-4" />
          Compartir
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          <button
            onClick={openInGoogleMaps}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="button-open-google-maps"
          >
            <MapPin className="h-4 w-4" />
            <span>Abrir en Google Maps</span>
          </button>

          <div className="h-px bg-border my-1" />
          
          <button
            onClick={copyLocationDataToClipboard}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="button-copy-location-data"
          >
            <Copy className="h-4 w-4" />
            <span>Copiar datos</span>
          </button>
          
          <button
            onClick={shareLocationViaWhatsApp}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="button-share-location-whatsapp"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Enviar por WhatsApp</span>
          </button>
          
          <button
            onClick={shareLocationViaEmail}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="button-share-location-email"
          >
            <Mail className="h-4 w-4" />
            <span>Enviar por Email</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  ) : null;

  // Add client button for client tab
  const addClientButton = activeTab === 'client' ? (
    <Button 
      variant="default" 
      size="sm"
      className="gap-2"
      onClick={() => openModal('project-client', { projectId: selectedProjectId })}
      data-testid="button-add-client-header"
    >
      <Plus className="h-4 w-4" />
      Agregar Cliente
    </Button>
  ) : null;

  const headerProps = {
    icon: FileText,
    title: 'Datos Básicos',
    description: 'Información general del proyecto, datos del cliente y ubicación',
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actions: shareButton ? [shareButton] : addClientButton ? [addClientButton] : undefined
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <ProjectBasicDataTab />;
      case 'location':
        return <ProjectLocationTab />;
      case 'client':
        return <ProjectClientTab />;
      default:
        return <ProjectBasicDataTab />;
    }
  };

  return (
    <>
      {/* Share Location BottomSheet (Mobile Only) */}
      <BottomSheet open={showShareBottomSheet} onOpenChange={setShowShareBottomSheet}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Compartir Ubicación</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetBody>
            <div className="space-y-1">
              <button
                onClick={() => {
                  openInGoogleMaps();
                  setShowShareBottomSheet(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-3 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                data-testid="button-open-google-maps-mobile"
              >
                <MapPin className="h-5 w-5" />
                <span>Abrir en Google Maps</span>
              </button>

              <div className="h-px bg-border my-1" />
              
              <button
                onClick={() => {
                  copyLocationDataToClipboard();
                  setShowShareBottomSheet(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-3 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                data-testid="button-copy-location-data-mobile"
              >
                <Copy className="h-5 w-5" />
                <span>Copiar datos</span>
              </button>
              
              <button
                onClick={() => {
                  shareLocationViaWhatsApp();
                  setShowShareBottomSheet(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-3 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                data-testid="button-share-location-whatsapp-mobile"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Enviar por WhatsApp</span>
              </button>
              
              <button
                onClick={() => {
                  shareLocationViaEmail();
                  setShowShareBottomSheet(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-3 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                data-testid="button-share-location-email-mobile"
              >
                <Mail className="h-5 w-5" />
                <span>Enviar por Email</span>
              </button>
            </div>
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheet>

      <Layout headerProps={headerProps} wide={false}>
        {renderTabContent()}
      </Layout>
    </>
  );
}
