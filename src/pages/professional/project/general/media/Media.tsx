import React, { useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaDocumentation } from './MediaDocumentation';
import { MediaGallery } from './MediaGallery';
import { FileText, Images } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';

export default function Media() {
  const { setSidebarContext } = useNavigationStore();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  const headerProps = {
    icon: FileText,
    title: "Media"
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <Tabs defaultValue="documentation" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documentation" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documentación
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Images className="w-4 h-4" />
            Galería
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="documentation" className="flex-1 mt-6">
          <MediaDocumentation />
        </TabsContent>
        
        <TabsContent value="gallery" className="flex-1 mt-6">
          <MediaGallery />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}