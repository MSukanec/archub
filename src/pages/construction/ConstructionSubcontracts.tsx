import { useState } from "react";
import { Package, Plus, Search, Filter } from "lucide-react";

import { Layout } from '@/components/layout/desktop/Layout';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { FeatureIntroduction } from "@/components/ui-custom/FeatureIntroduction";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useMobile } from "@/hooks/use-mobile";

export default function ConstructionSubcontracts() {
  const { data: userData } = useCurrentUser();
  const isMobile = useMobile();
  
  // Estado para controles del ActionBar
  const [searchQuery, setSearchQuery] = useState('');

  const features = [
    {
      icon: <Package className="w-4 h-4" />,
      title: "Gestión de Subcontratos",
      description: "Crea y administra pedidos de subcontrato para diferentes especialidades de la obra."
    },
    {
      icon: <Search className="w-4 h-4" />,
      title: "Búsqueda Avanzada",
      description: "Encuentra rápidamente subcontratos por especialidad, estado, fecha o contratista."
    },
    {
      icon: <Filter className="w-4 h-4" />,
      title: "Filtros Inteligentes",
      description: "Filtra subcontratos por estado, especialidad, prioridad o fechas de ejecución."
    },
    {
      icon: <Plus className="w-4 h-4" />,
      title: "Control de Estados",
      description: "Gestiona el ciclo completo desde pedido inicial hasta finalización y facturación."
    }
  ];

  const handleCreateSubcontract = () => {
    // Por ahora no hace nada según lo solicitado
    console.log('Crear Pedido de Subcontrato - Funcionalidad pendiente');
  };

  return (
    <Layout wide={false}>
      <div className="space-y-6">
        {/* ActionBar */}
        <ActionBarDesktop
          title="Gestión de Subcontratos"
          icon={<Package className="w-6 h-6" />}
          features={features}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          primaryActionLabel="Crear Pedido de Subcontrato"
          onPrimaryActionClick={handleCreateSubcontract}
          showProjectSelector={true}
        />



        {/* EmptyState - se mostrará hasta que se implemente la funcionalidad */}
        <EmptyState
          icon={<Package className="w-12 h-12 text-muted-foreground" />}
          title="Aún no tienes subcontratos creados"
          description="Los subcontratos te permiten gestionar trabajos especializados que requieren contratistas externos. Puedes controlar estados, fechas y presupuestos."
        />
      </div>
    </Layout>
  );
}