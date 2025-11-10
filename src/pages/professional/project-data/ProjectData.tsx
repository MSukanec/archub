import { useEffect, useState } from 'react';
import { FileText, Share2, Copy, MessageCircle, Mail, MapPin } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectContext } from '@/stores/projectContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import ProjectBasicDataTab from './ProjectBasicDataTab';
import ProjectLocationTab from './ProjectLocationTab';
import ProjectClientTab from './ProjectClientTab';

export default function ProjectData() {
  const [activeTab, setActiveTab] = useState('basic');
  const { setSidebarContext } = useNavigationStore();
  const { selectedProjectId } = useProjectContext();
  const { toast } = useToast();

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

  // Helper functions for sharing location data
  const copyLocationDataToClipboard = async () => {
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
  };

  const shareLocationViaWhatsApp = () => {
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
  };

  const shareLocationViaEmail = () => {
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
  };

  const openInGoogleMaps = () => {
    if (!projectLocationData || !projectLocationData.lat || !projectLocationData.lng) {
      toast({
        title: "Sin coordenadas",
        description: "No hay coordenadas disponibles para abrir en Google Maps",
        variant: "destructive"
      });
      return;
    }

    // Open Google Maps with directions to the location
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${projectLocationData.lat},${projectLocationData.lng}`;
    window.open(mapsUrl, '_blank');
  };

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
      label: 'Cliente',
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

  const headerProps = {
    icon: FileText,
    title: 'Datos Básicos',
    subtitle: 'Información general del proyecto, datos del cliente y ubicación',
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actions: shareButton ? [shareButton] : undefined
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
    <Layout headerProps={headerProps} wide={false}>
      {renderTabContent()}
    </Layout>
  );
}
