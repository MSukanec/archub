import { Calendar, User, Hash, Ruler, Building, Tag, FileText, Zap } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormSubsectionButton } from '@/components/modal/form/FormSubsectionButton';

interface TaskBasicDataViewProps {
  task: any;
  onTabChange?: (tab: string) => void;
}

export function TaskBasicDataView({ 
  task,
  onTabChange 
}: TaskBasicDataViewProps) {
  return (
    <div className="space-y-6">
      {/* Cards principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card izquierda - Ficha de la Tarea */}
        <Card className="h-full flex flex-col">
          <CardHeader 
            icon={FileText}
            title="Ficha de la Tarea"
            description="Información general y detalles de la tarea"
          />
          <CardContent className="flex-1 space-y-3 pt-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Código</p>
                  <p className="text-sm text-muted-foreground">{task.code || 'Sin código'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">División</p>
                  <p className="text-sm text-muted-foreground">{task.division || 'Sin división'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Categoría</p>
                  <p className="text-sm text-muted-foreground">{task.category || 'Sin categoría'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Unidad</p>
                  <p className="text-sm text-muted-foreground">{task.unit || 'Sin unidad'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Creador</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {task.is_system ? 'Sistema' : 'Usuario personalizado'}
                    </p>
                    <Badge variant={task.is_system ? "default" : "secondary"} className="h-4 text-xs">
                      {task.is_system ? 'SISTEMA' : 'USUARIO'}
                    </Badge>
                  </div>
                </div>
              </div>

              {task.created_at && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha de Creación</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
              )}

              {task.description && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium mb-2">Descripción</p>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card derecha - Acciones rápidas */}
        <Card className="h-full flex flex-col">
          <CardHeader 
            icon={Zap}
            title="Acciones Rápidas"
            description="Accesos directos para gestionar la tarea"
          />
          <CardContent className="flex-1 space-y-3 pt-4">
            <FormSubsectionButton
              icon={<FileText className="h-4 w-4" />}
              title="Ver costos"
              description="Materiales y mano de obra asociada"
              onClick={() => onTabChange?.('Costos')}
            />

            <FormSubsectionButton
              icon={<Building className="h-4 w-4" />}
              title="Editar información"
              description="Modificar datos básicos de la tarea"
              onClick={() => {
                // TODO: Implementar modal de edición
                console.log('Editar tarea functionality to be implemented');
              }}
              disabled={task.is_system}
            />

            <FormSubsectionButton
              icon={<Hash className="h-4 w-4" />}
              title="Ver dependencias"
              description="Parámetros y relaciones de la tarea"
              onClick={() => {
                // TODO: Implementar vista de dependencias
                console.log('Task dependencies functionality to be implemented');
              }}
              disabled={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Card inferior - Información técnica */}
      <Card className="h-full flex flex-col">
        <CardHeader 
          icon={Ruler}
          title="Información Técnica"
          description="Especificaciones y parámetros técnicos de la tarea"
        />
        <CardContent className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-1">Tipo de Tarea</p>
              <p className="text-sm text-muted-foreground">
                {task.is_system ? 'Paramétrica del Sistema' : 'Personalizada'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-1">ID de Tarea</p>
              <p className="text-sm text-muted-foreground font-mono text-xs">{task.id}</p>
            </div>

            {task.updated_at && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium mb-1">Última Modificación</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(task.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
            )}

            {task.unit_symbol && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium mb-1">Símbolo de Unidad</p>
                <p className="text-sm text-muted-foreground">{task.unit_symbol}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}