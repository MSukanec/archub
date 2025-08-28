import React from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui-custom/security/EmptyState";
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";

interface AttendeeData {
  id: string;
  personnel_id: string;
  contact_type: string;
  attendance_type: 'full' | 'half';
  hours_worked: number;
  description: string;
  arrival_time: string;
  departure_time: string;
  notes: string;
}

interface PersonnelFormProps {
  attendees: AttendeeData[];
  setAttendees: (attendees: AttendeeData[]) => void;
  projectPersonnel: any[];
}

export function PersonnelForm({ 
  attendees, 
  setAttendees, 
  projectPersonnel 
}: PersonnelFormProps) {
  const { closeModal } = useGlobalModalStore();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
        <div className="col-span-1">✓</div>
        <div className="col-span-4">Personal</div>
        <div className="col-span-3">Horario</div>
        <div className="col-span-4">Descripción</div>
      </div>

      {/* Lista completa de personal del proyecto */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {projectPersonnel.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="No hay personal asignado"
            description="Necesitas asignar personal al proyecto antes de registrar en la bitácora"
            action={
              <Button
                variant="default"
                onClick={() => {
                  closeModal();
                  // Navigate to personnel page
                  window.location.href = '/construction/personnel';
                }}
              >
                Gestionar Personal
              </Button>
            }
          />
        ) : (
        projectPersonnel?.map((personnel: any) => {
          const contact = personnel.contact;
          const isPresent = attendees.some(a => a.personnel_id === personnel.id);
          const attendeeData = attendees.find(a => a.personnel_id === personnel.id);
          
          return (
            <div key={personnel.id} className="grid grid-cols-12 gap-1 items-center py-1 border-b border-muted/20">
              {/* Checkbox */}
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={isPresent}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Agregar personal
                      setAttendees([...attendees, {
                        id: Date.now().toString(),
                        personnel_id: personnel.id,
                        contact_type: '',
                        attendance_type: 'full',
                        hours_worked: 8,
                        description: '',
                        // Campos legacy para compatibilidad
                        arrival_time: '',
                        departure_time: '',
                        notes: ''
                      }]);
                    } else {
                      // Quitar personal
                      setAttendees(attendees.filter(a => a.personnel_id !== personnel.id));
                    }
                  }}
                  className="h-4 w-4 rounded checkbox-accent"
                />
              </div>

              {/* Nombre del contacto */}
              <div className="col-span-4">
                <span className={`text-sm ${isPresent ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {contact?.first_name || ''} {contact?.last_name || ''}
                </span>
              </div>

              {/* Selector de horario */}
              <div className="col-span-3">
                <Select
                  value={attendeeData?.attendance_type || 'full'}
                  onValueChange={(value) => {
                    if (isPresent) {
                      const newAttendees = attendees.map((a: any) => 
                        a.personnel_id === personnel.id 
                          ? { ...a, attendance_type: value as 'full' | 'half' }
                          : a
                      );
                      setAttendees(newAttendees);
                    }
                  }}
                  disabled={!isPresent}
                >
                  <SelectTrigger className={`h-8 text-xs ${!isPresent ? 'opacity-50' : ''}`}>
                    <SelectValue placeholder="Horario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Jornada Completa</SelectItem>
                    <SelectItem value="half">Media Jornada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campo de descripción */}
              <div className="col-span-4">
                <Input
                  placeholder="Notas adicionales..."
                  value={attendeeData?.description || ''}
                  onChange={(e) => {
                    if (isPresent) {
                      const newAttendees = attendees.map((a: any) => 
                        a.personnel_id === personnel.id 
                          ? { ...a, description: e.target.value }
                          : a
                      );
                      setAttendees(newAttendees);
                    }
                  }}
                  disabled={!isPresent}
                  className={`h-8 text-xs ${!isPresent ? 'opacity-50' : ''}`}
                />  
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* Contador de personal presente */}
      {attendees.length > 0 && (
        <div className="text-sm text-muted-foreground text-center pt-2 border-t">
          Personal presente: {attendees.length}
        </div>
      )}
    </div>
  );
}