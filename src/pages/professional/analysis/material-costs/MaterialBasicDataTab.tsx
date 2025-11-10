import { Calendar, User, Package, Ruler, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormSubsectionButton } from '@/components/modal/form/FormSubsectionButton';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useLocation } from 'wouter';
import { useDeleteMaterial } from '@/hooks/use-materials';
import { Badge } from '@/components/ui/badge';

interface MaterialBasicDataTabProps {
  material: any;
  onTabChange?: (tab: string) => void;
}

export function MaterialBasicDataTab({ 
  material,
  onTabChange 
}: MaterialBasicDataTabProps) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const [, navigate] = useLocation();
  const deleteMaterialMutation = useDeleteMaterial();
  
  const isSystemMaterial = material.is_system;
  
  // Determinar si el usuario puede editar este material
  // ADMIN: puede editar todo (sistema y organización)
  // Usuario normal: solo puede editar materiales de su organización (no sistema)
  const canEdit = userData?.role?.name === 'Administrador' || !isSystemMaterial;
  
  // Función para eliminar material
  const handleDeleteMaterial = () => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: "Eliminar material",
      description: `¿Estás seguro que querés eliminar "${material.name}"? Esta acción no se puede deshacer.`,
      itemName: material.name,
      itemType: "material",
      destructiveActionText: "Eliminar material",
      onConfirm: async () => {
        try {
          await deleteMaterialMutation.mutateAsync(material.id);
          navigate('/analysis');
        } catch (error) {
          console.error('Error deleting material:', error);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Cards principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card izquierda - Ficha del Material */}
        <Card className="h-full flex flex-col">
          <CardHeader 
            icon={Package}
            title="Ficha del Material"
            description="Información general y detalles del material"
          />
          <CardContent className="flex-1 space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Creador y Fecha de Creación - Inline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Tipo</p>
                    <div className="mt-1">
                      <Badge 
                        variant={isSystemMaterial ? "default" : "secondary"}
                        className={`text-xs ${isSystemMaterial 
                          ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90' 
                          : 'bg-[var(--accent-2)] text-white hover:bg-[var(--accent-2)]/90'
                        }`}
                      >
                        {isSystemMaterial ? 'Sistema' : 'Organización'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {material.created_at && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Fecha de Creación</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(material.created_at), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Nombre del Material */}
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium mb-2">Nombre</p>
                <p className="text-sm text-muted-foreground">{material.name}</p>
              </div>

              {/* Categoría */}
              {material.category_name && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium mb-2">Categoría</p>
                  <p className="text-sm text-muted-foreground">{material.category_name}</p>
                </div>
              )}

              {/* Tipo de Material */}
              {material.material_type && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium mb-2">Tipo de Material</p>
                  <p className="text-sm text-muted-foreground">{material.material_type}</p>
                </div>
              )}

              {/* Unidad de Cómputo */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Unidad de Cómputo</p>
                  <p className="text-sm text-muted-foreground">
                    {material.unit_of_computation || material.unit_description || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card derecha - Información de Precios */}
        <Card className="h-full flex flex-col">
          <CardHeader 
            icon={Package}
            title="Información de Precios"
            description="Estadísticas de precios del material"
          />
          <CardContent className="flex-1 space-y-4 pt-4">
            <div className="space-y-4">
              {/* Precio Promedio */}
              {material.avg_price !== null && material.avg_price !== undefined && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium mb-2">Precio Promedio</p>
                  <p className="text-2xl font-bold">
                    ARS {material.avg_price.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Rango de Precios */}
              {(material.min_price !== null || material.max_price !== null) && (
                <div className="grid grid-cols-2 gap-3">
                  {material.min_price !== null && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-sm font-medium mb-1">Precio Mínimo</p>
                      <p className="text-lg font-semibold">
                        ARS {material.min_price.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {material.max_price !== null && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-sm font-medium mb-1">Precio Máximo</p>
                      <p className="text-lg font-semibold">
                        ARS {material.max_price.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Contador de Productos */}
              {material.product_count !== null && material.product_count !== undefined && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium mb-2">Productos Asociados</p>
                  <p className="text-lg font-semibold">
                    {material.product_count} producto{material.product_count !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Botón Eliminar material al final - Solo si puede editar */}
              {canEdit && (
                <div className="mt-6 pt-3 border-t">
                  <FormSubsectionButton
                    icon={<Trash2 className="h-4 w-4" />}
                    title="Eliminar material"
                    description="Eliminar permanentemente este material"
                    onClick={handleDeleteMaterial}
                    variant="destructive"
                    showPlusIcon={false}
                    data-testid="button-eliminar-material"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
