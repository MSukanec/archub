import { useState, useMemo } from "react";
import { Package, Plus, Edit, Trash2, Eye, Award, DollarSign, TrendingUp, Calculator } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useMobile } from '@/hooks/use-mobile';
import { useTaskMaterials } from '@/hooks/use-generated-tasks';

interface TaskMaterialsViewProps {
  task: any;
}

export function TaskMaterialsView({ task }: TaskMaterialsViewProps) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const isMobile = useMobile();
  const [, navigate] = useLocation();
  
  // Estados para controles del TableTopBar
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado');

  // Obtener datos reales de materiales usando el hook existente
  const taskId = task?.task_id || task?.id;
  const { data: rawMaterials = [], isLoading } = useTaskMaterials(taskId);

  // Transformar datos para la tabla
  const materials = rawMaterials.map((material: any) => {
    const materialView = Array.isArray(material.material_view) ? material.material_view[0] : material.material_view;
    const unitPrice = materialView?.computed_unit_price || 0;
    const quantity = material.amount || 0;
    const totalPrice = quantity * unitPrice;

    return {
      id: material.id,
      name: materialView?.name || 'Material sin nombre',
      unit: materialView?.unit_of_computation || 'Unidad',
      quantity: quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      category: materialView?.category_name || 'Sin categoría',
      material_id: material.material_id
    };
  });

  // Cálculos para KPIs de materiales
  const kpiData = useMemo(() => {
    if (materials.length === 0) return null;

    const totalMaterials = materials.length;
    const totalValue = materials.reduce((sum, m) => sum + m.total_price, 0);
    const averagePrice = totalValue / totalMaterials;
    
    // Simulación de completitud (en futuro será real)
    const completedMaterials = Math.floor(totalMaterials * 0.75);
    const completionPercentage = (completedMaterials / totalMaterials) * 100;

    return {
      totalMaterials,
      completedMaterials,
      totalValue,
      averagePrice,
      completionPercentage
    };
  }, [materials]);

  // Función para formatear montos
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filtrar materiales por búsqueda
  const filteredMaterials = materials.filter(material => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = material.name?.toLowerCase().includes(searchLower);
    const categoryMatch = material.category?.toLowerCase().includes(searchLower);
    return !searchQuery || nameMatch || categoryMatch;
  });

  // Función para abrir modal de agregar material
  const handleAddMaterial = () => {
    // TODO: Implementar modal de agregar material
    console.log('Agregar material a tarea:', task?.id);
  };

  // Función para editar material
  const handleEditMaterial = (material: any) => {
    // TODO: Implementar modal de editar material
    console.log('Editar material:', material.id);
  };

  // Función para eliminar material
  const handleDeleteMaterial = (material: any) => {
    // TODO: Implementar eliminación
    console.log('Eliminar material:', material.id);
  };

  // Función para ver detalles del material
  const handleViewMaterial = (material: any) => {
    navigate(`/library/materials/${material.id}`);
  };

  // Definir columnas de la tabla
  const columns = [
    {
      key: 'name',
      label: 'Material',
      sortable: true,
      width: '40%',
      render: (material: any) => (
        <div>
          <div className="text-sm text-muted-foreground">{material.name}</div>
          <div className="font-medium">{material.category}</div>
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      sortable: true,
      render: (material: any) => (
        <div className="font-medium">
          {material.quantity} {material.unit}
        </div>
      )
    },
    {
      key: 'unit_price',
      label: 'Precio Unitario Promedio',
      sortable: true,
      render: (material: any) => (
        <div className="text-right">
          {formatCurrency(material.unit_price)}
        </div>
      )
    },
    {
      key: 'total_price',
      label: 'Subtotal',
      sortable: true,
      render: (material: any) => (
        <div className="text-right font-medium">
          {formatCurrency(material.total_price)}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (material: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleViewMaterial(material)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleEditMaterial(material)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDeleteMaterial(material)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {kpiData && (
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
          {/* Total Materiales */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Materiales' : 'Total Materiales'}
                  </p>
                  <Package className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Mini gráfico de barras */}
                <div className={`flex items-end gap-1 ${isMobile ? 'h-6' : 'h-8'}`}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-sm flex-1"
                      style={{
                        backgroundColor: 'var(--accent)',
                        height: `${Math.max(30, Math.random() * 100)}%`,
                        opacity: i < kpiData.totalMaterials ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{kpiData.totalMaterials}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {kpiData.completedMaterials} configurados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valor Total */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Valor Total' : 'Valor Total'}
                  </p>
                  <DollarSign className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Gráfico de línea de tendencia */}
                <div className={`flex items-center gap-1 ${isMobile ? 'h-6' : 'h-8'}`}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full"
                      style={{
                        backgroundColor: 'var(--accent)',
                        height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%`
                      }}
                    />
                  ))}
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {formatCurrency(kpiData.totalValue)}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    Costo estimado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Precio Promedio */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Precio Promedio' : 'Precio Promedio'}
                  </p>
                  <Calculator className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Barra de progreso horizontal */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} bg-muted rounded-full overflow-hidden flex`}>
                  <div 
                    className="rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--accent)',
                      width: '65%'
                    }}
                  />
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {formatCurrency(kpiData.averagePrice)}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    Por material
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado General */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Estado General' : 'Estado General'}
                  </p>
                  <TrendingUp className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Gráfico de progreso circular simulado */}
                <div className={`flex items-center justify-center ${isMobile ? 'h-6' : 'h-8'}`}>
                  <div className="flex items-end gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full"
                        style={{
                          backgroundColor: 'var(--accent)',
                          height: `${Math.sin((i / 10) * Math.PI) * 100}%`,
                          opacity: i < (kpiData.completionPercentage / 10) ? 1 : 0.3
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {Math.round(kpiData.completionPercentage)}%
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    Completitud
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de Materiales */}
      {isLoading ? (
        // Estado de carga
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredMaterials.length > 0 ? (
        <Table
          data={filteredMaterials}
          columns={columns}
        />
      ) : (
        <EmptyState
          icon={<Package className="h-16 w-16" />}
          title="Sin materiales configurados"
          description="Los materiales asociados a esta tarea aparecerán aquí."
          action={
            <Button variant="default" size="sm" onClick={handleAddMaterial}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Material
            </Button>
          }
        />
      )}
    </div>
  );
}