import { Calendar, User, Ruler, Building, FileText, Zap, Hash } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormSubsectionButton } from '@/components/modal/form/FormSubsectionButton';
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField';

interface TaskBasicDataViewProps {
  task: any;
  onTabChange?: (tab: string) => void;
}

export function TaskBasicDataView({ 
  task,
  onTabChange 
}: TaskBasicDataViewProps) {
  const [taskName, setTaskName] = useState(task.custom_name || task.name_rendered || '');
  const [taskRubro, setTaskRubro] = useState(task.division || '');
  const [taskUnit, setTaskUnit] = useState(task.unit || '');
  const [taskDate, setTaskDate] = useState(task.created_at ? format(new Date(task.created_at), 'yyyy-MM-dd') : '');
  
  const isSystemTask = task.is_system;
  
  // Mock options - TODO: Conectar con datos reales
  const rubroOptions = [
    { value: 'Mamposterías', label: 'Mamposterías' },
    { value: 'Aberturas', label: 'Aberturas' },
    { value: 'Cielorrasos', label: 'Cielorrasos' },
    { value: 'Contrapisos y Carpetas', label: 'Contrapisos y Carpetas' },
    { value: 'Equipamiento', label: 'Equipamiento' },
    { value: 'Pinturas', label: 'Pinturas' },
    { value: 'Pisos', label: 'Pisos' },
    { value: 'Revestimientos', label: 'Revestimientos' },
    { value: 'Revoques', label: 'Revoques' }
  ];
  
  const unitOptions = [
    { value: 'm²', label: 'm²' },
    { value: 'm', label: 'm' },
    { value: 'ml', label: 'ml' },
    { value: 'un', label: 'un' },
    { value: 'kg', label: 'kg' },
    { value: 'm³', label: 'm³' },
    { value: 'gl', label: 'gl' }
  ];

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
          <CardContent className="flex-1 space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Creador - Primer lugar */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Creador</p>
                  <p className="text-sm text-muted-foreground">
                    {isSystemTask ? 'Sistema' : 'Usuario personalizado'}
                  </p>
                </div>
              </div>

              {/* Nombre de la Tarea - Editable */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de la Tarea</label>
                <Input
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Nombre de la tarea"
                  disabled={isSystemTask}
                />
              </div>

              {/* Rubro - Editable con ComboBox */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rubro</label>
                <ComboBox
                  value={taskRubro}
                  onValueChange={setTaskRubro}
                  options={rubroOptions}
                  placeholder="Seleccionar rubro"
                  disabled={isSystemTask}
                  allowCreate={!isSystemTask}
                />
              </div>

              {/* Unidad de Cómputo - Editable con ComboBox */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidad de Cómputo</label>
                <ComboBox
                  value={taskUnit}
                  onValueChange={setTaskUnit}
                  options={unitOptions}
                  placeholder="Seleccionar unidad"
                  disabled={isSystemTask}
                  allowCreate={!isSystemTask}
                />
              </div>

              {/* Fecha de la Tarea - Editable */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de la Tarea</label>
                <Input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  disabled={isSystemTask}
                />
              </div>

              {/* Descripción - Si existe */}
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
              title="Guardar cambios"
              description="Aplicar modificaciones realizadas"
              onClick={() => {
                // TODO: Implementar guardado de cambios
                console.log('Guardar cambios:', { taskName, taskRubro, taskUnit, taskDate });
              }}
              disabled={isSystemTask}
            />

            <FormSubsectionButton
              icon={<Ruler className="h-4 w-4" />}
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
    </div>
  );
}