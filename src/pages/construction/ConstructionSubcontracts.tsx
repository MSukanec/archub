import { useState } from "react";
import { Package, Plus, Search, Filter, Edit, Trash2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Layout } from '@/components/layout/desktop/Layout';
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { Subcontract } from "@/components/ui-custom/Subcontract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useSubcontracts, useDeleteSubcontract } from "@/hooks/use-subcontracts";
import { useSubcontractAnalysis } from "@/hooks/use-subcontract-analysis";

export default function ConstructionSubcontracts() {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const deleteSubcontract = useDeleteSubcontract();
  
  // Estado para controles del TableTopBar
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado');

  // Función para crear subcontrato
  const handleCreateSubcontract = () => {
    openModal('subcontract', {
      projectId: userData?.preferences?.last_project_id,
      organizationId: userData?.organization?.id,
      userId: userData?.user?.id,
      isEditing: false
    });
  };
  
  // Datos de subcontratos con análisis de pagos
  const { data: subcontracts = [], isLoading } = useSubcontracts(userData?.preferences?.last_project_id || null);
  const { data: subcontractAnalysis = [], isLoading: isLoadingAnalysis } = useSubcontractAnalysis(userData?.preferences?.last_project_id || null);



  // Combinar datos de subcontratos con análisis de pagos
  const enrichedSubcontracts = subcontracts.map(subcontract => {
    const analysis = subcontractAnalysis.find(a => a.id === subcontract.id);
    return {
      ...subcontract,
      analysis: analysis || {
        pagoALaFecha: 0,
        pagoALaFechaUSD: 0,
        saldo: subcontract.amount_total || 0,
        saldoUSD: (subcontract.amount_total || 0) / (subcontract.exchange_rate || 1)
      }
    };
  });



  // Filtrar subcontratos por búsqueda
  const filteredSubcontracts = enrichedSubcontracts.filter(subcontract => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = subcontract.title?.toLowerCase().includes(searchLower);
    
    // Buscar en el nombre del contacto usando la misma lógica de renderizado
    const contact = subcontract.contact;
    const contactName = contact?.full_name || 
      `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim();
    const contactMatch = contactName?.toLowerCase().includes(searchLower);
    
    return titleMatch || contactMatch;
  });

  const headerProps = {
    icon: Package,
    title: "Subcontratos",
    showHeaderSearch: true,
    headerSearchValue: searchQuery,
    onHeaderSearchChange: setSearchQuery,
    showHeaderFilter: true,
    renderHeaderFilterContent: () => (
      <div className="space-y-3 p-2 min-w-[200px]">
        <div>
          <Label className="text-xs font-medium mb-1 block">Moneda</Label>
          <Select 
            value={currencyView} 
            onValueChange={(value: string) => setCurrencyView(value as 'discriminado' | 'pesificado' | 'dolarizado')}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Seleccionar moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discriminado">Todo</SelectItem>
              <SelectItem value="pesificado">Peso Argentino</SelectItem>
              <SelectItem value="dolarizado">Dólar Estadounidense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    ),
    isHeaderFilterActive: currencyView !== 'discriminado',
    showHeaderClearFilters: currencyView !== 'discriminado',
    onHeaderClearFilters: () => setCurrencyView('discriminado'),
    actionButton: {
      label: 'Crear Subcontrato',
      icon: Plus,
      onClick: handleCreateSubcontract
    }
  }



  return (
    <Layout wide={true} headerProps={headerProps}>
      {filteredSubcontracts.length === 0 && !isLoading && !isLoadingAnalysis ? (
        <EmptyState
          icon={<Package className="w-12 h-12 text-muted-foreground" />}
          title="Aún no tienes subcontratos creados"
          description="Los subcontratos te permiten gestionar trabajos especializados que requieren contratistas externos. Puedes controlar estados, fechas y presupuestos."
        />
      ) : (
        <div className="space-y-4">
            {(isLoading || isLoadingAnalysis) ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted/20 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              filteredSubcontracts.map((subcontract) => (
                <Subcontract
                  key={subcontract.id}
                  subcontract={subcontract}
                  currencyView={currencyView}
                  onEdit={() => {
                    openModal('subcontract', {
                      projectId: userData?.preferences?.last_project_id,
                      organizationId: userData?.organization?.id,
                      userId: userData?.user?.id,
                      subcontractId: subcontract.id,
                      isEditing: true
                    });
                  }}
                  onDelete={() => {
                    openModal('delete-confirmation', {
                      title: 'Eliminar Subcontrato',
                      description: `¿Estás seguro de que deseas eliminar el subcontrato "${subcontract.title}"?`,
                      confirmText: 'Eliminar',
                      mode: 'dangerous',
                      onConfirm: () => {
                        deleteSubcontract.mutate(subcontract.id);
                      }
                    });
                  }}
                  onNewProposal={() => {
                    openModal('subcontract-bid', {
                      subcontractId: subcontract.id,
                      projectId: userData?.preferences?.last_project_id,
                      organizationId: userData?.organization?.id,
                      isEditing: false
                    });
                  }}
                />
              ))
            )}
        </div>
      )}
    </Layout>
  );
}