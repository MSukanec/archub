import React, { useState, useEffect } from 'react';
import { FormModalLayout } from './FormModalLayout';
import { FormModalHeader } from './FormModalHeader';
import { FormModalFooter } from './FormModalFooter';
import { useModalPanelStore } from './modalPanelStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  Edit3, 
  Plus, 
  ArrowLeft, 
  Save, 
  Calendar,
  DollarSign,
  User,
  FileText
} from 'lucide-react';

interface TestFormModalProps {
  open: boolean;
  onClose: () => void;
}

export function TestFormModal({ open, onClose }: TestFormModalProps) {
  const { currentPanel, setPanel, resetToView } = useModalPanelStore();
  const [formData, setFormData] = useState({
    title: 'Pago de Materiales - Cemento',
    amount: '25000',
    date: '2025-01-14',
    description: 'Compra de cemento para la construcción del segundo piso',
    category: 'materiales',
    responsible: 'Juan Pérez',
  });

  const [eventData, setEventData] = useState({
    eventType: '',
    eventDate: '',
    eventDescription: '',
  });

  // Reset modal to view state when opening
  useEffect(() => {
    if (open) {
      resetToView();
    }
  }, [open, resetToView]);

  if (!open) return null;

  const handleClose = () => {
    resetToView();
    onClose();
  };

  // VIEW PANEL
  const viewPanel = (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-accent/10 to-accent/5 p-4 rounded-lg border">
        <h4 className="font-medium mb-2">🔍 Panel de Solo Lectura</h4>
        <p className="text-sm text-muted-foreground">
          Este es el panel VIEW que muestra la información sin posibilidad de edición.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Movimiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Título</p>
                <p className="font-medium">{formData.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Monto</p>
                <p className="font-medium">${formData.amount}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="font-medium">{formData.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Responsable</p>
                <p className="font-medium">{formData.responsible}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Descripción</p>
            <p className="mt-1">{formData.description}</p>
          </div>
          
          <Badge variant="secondary">Estado: Procesado</Badge>
        </CardContent>
      </Card>
    </div>
  );

  // EDIT PANEL
  const editPanel = (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-4 rounded-lg border">
        <h4 className="font-medium mb-2">✏️ Panel de Edición</h4>
        <p className="text-sm text-muted-foreground">
          Este es el panel EDIT donde puedes modificar todos los campos del movimiento.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({...formData, category: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="materiales">Materiales</SelectItem>
                <SelectItem value="servicios">Servicios</SelectItem>
                <SelectItem value="herramientas">Herramientas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="responsible">Responsable</Label>
          <Input
            id="responsible"
            value={formData.responsible}
            onChange={(e) => setFormData({...formData, responsible: e.target.value})}
          />
        </div>

        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  // SUBFORM PANEL
  const subformPanel = (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 p-4 rounded-lg border">
        <h4 className="font-medium mb-2">➕ Panel de Subformulario</h4>
        <p className="text-sm text-muted-foreground">
          Este es el panel SUBFORM para agregar información contextual como eventos.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="eventType">Tipo de Evento</Label>
          <Select
            value={eventData.eventType}
            onValueChange={(value) => setEventData({...eventData, eventType: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revision">Revisión</SelectItem>
              <SelectItem value="aprobacion">Aprobación</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="nota">Nota</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="eventDate">Fecha del Evento</Label>
          <Input
            id="eventDate"
            type="date"
            value={eventData.eventDate}
            onChange={(e) => setEventData({...eventData, eventDate: e.target.value})}
          />
        </div>

        <div>
          <Label htmlFor="eventDescription">Descripción del Evento</Label>
          <Textarea
            id="eventDescription"
            value={eventData.eventDescription}
            onChange={(e) => setEventData({...eventData, eventDescription: e.target.value})}
            rows={4}
            placeholder="Describe los detalles del evento..."
          />
        </div>
      </div>
    </div>
  );

  // Header content based on current panel
  const getHeaderContent = () => {
    switch (currentPanel) {
      case 'edit':
        return (
          <FormModalHeader 
            title="Editar Movimiento Financiero"
            leftActions={
              <Button variant="ghost" size="sm" onClick={() => setPanel('view')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            }
          />
        );
      case 'subform':
        return (
          <FormModalHeader 
            title="Agregar Evento al Movimiento"
            leftActions={
              <Button variant="ghost" size="sm" onClick={() => setPanel('edit')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            }
          />
        );
      default:
        return <FormModalHeader title="Detalles del Movimiento Financiero" />;
    }
  };

  // Footer content based on current panel
  const getFooterContent = () => {
    switch (currentPanel) {
      case 'subform':
        return (
          <FormModalFooter
            leftActions={
              <Button variant="outline" onClick={() => setPanel('edit')}>
                Cancelar
              </Button>
            }
            rightActions={
              <Button onClick={() => setPanel('edit')}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Evento
              </Button>
            }
          />
        );
      case 'edit':
        return (
          <FormModalFooter
            leftActions={
              <Button variant="outline" onClick={() => setPanel('view')}>
                Cancelar Edición
              </Button>
            }
            rightActions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPanel('subform')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Evento
                </Button>
                <Button onClick={() => setPanel('view')}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            }
          />
        );
      default:
        return (
          <FormModalFooter
            leftActions={
              <Badge variant="secondary">
                Última modificación: hace 2 días
              </Badge>
            }
            rightActions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPanel('edit')}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" onClick={() => setPanel('subform')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Evento
                </Button>
              </div>
            }
          />
        );
    }
  };

  return (
    <FormModalLayout
      viewPanel={viewPanel}
      editPanel={editPanel}
      subformPanel={subformPanel}
      onClose={handleClose}
      headerContent={getHeaderContent()}
      footerContent={getFooterContent()}
    />
  );
}