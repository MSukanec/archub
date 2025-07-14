import React, { useState, useEffect } from 'react';
import { FormModalLayout } from './FormModalLayout';
import { FormModalHeader } from './FormModalHeader';
import { FormModalFooter } from './FormModalFooter';
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

type ModalState = 'read' | 'edit' | 'subform';

export function TestFormModal({ open, onClose }: TestFormModalProps) {
  const [currentState, setCurrentState] = useState<ModalState>('read');
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

  if (!open) return null;

  const renderLeftPanel = () => {
    if (currentState === 'subform') return null;
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-4">Vista de Movimiento</h3>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Información Principal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{formData.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">${formData.amount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formData.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formData.responsible}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Procesado</Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">Acciones Rápidas</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setCurrentState('edit')}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Editar Movimiento
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setCurrentState('subform')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Evento
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderCenterPanel = () => {
    if (currentState === 'subform') return null;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-4">
            {currentState === 'edit' ? 'Editar Movimiento' : 'Detalles del Movimiento'}
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  readOnly={currentState === 'read'}
                  className={currentState === 'read' ? 'bg-muted' : ''}
                />
              </div>
              <div>
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  readOnly={currentState === 'read'}
                  className={currentState === 'read' ? 'bg-muted' : ''}
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
                  readOnly={currentState === 'read'}
                  className={currentState === 'read' ? 'bg-muted' : ''}
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                  disabled={currentState === 'read'}
                >
                  <SelectTrigger className={currentState === 'read' ? 'bg-muted' : ''}>
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
                readOnly={currentState === 'read'}
                className={currentState === 'read' ? 'bg-muted' : ''}
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                readOnly={currentState === 'read'}
                className={currentState === 'read' ? 'bg-muted' : ''}
                rows={3}
              />
            </div>

            {currentState === 'read' && (
              <div className="bg-gradient-to-r from-accent/10 to-accent/5 p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Vista de Solo Lectura</h4>
                <p className="text-sm text-muted-foreground">
                  Este es el panel central en modo de solo lectura. Aquí se muestran todos los detalles del movimiento financiero.
                </p>
              </div>
            )}

            {currentState === 'edit' && (
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Modo de Edición</h4>
                <p className="text-sm text-muted-foreground">
                  Ahora puedes editar todos los campos del movimiento. Los cambios se guardarán automáticamente.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRightPanel = () => {
    if (currentState !== 'subform') return null;

    return (
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentState('read')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <h3 className="font-semibold text-lg mb-4">Agregar Evento</h3>
          
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
              <Label htmlFor="eventDescription">Descripción</Label>
              <Textarea
                id="eventDescription"
                value={eventData.eventDescription}
                onChange={(e) => setEventData({...eventData, eventDescription: e.target.value})}
                rows={4}
                placeholder="Describe los detalles del evento..."
              />
            </div>

            <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Subformulario Contextual</h4>
              <p className="text-sm text-muted-foreground">
                Este es el panel derecho que permite agregar información contextual como eventos, notas, o formularios relacionados.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getHeaderContent = () => {
    switch (currentState) {
      case 'edit':
        return <FormModalHeader title="Editar Movimiento Financiero" />;
      case 'subform':
        return <FormModalHeader title="Agregar Evento al Movimiento" />;
      default:
        return <FormModalHeader title="Detalles del Movimiento Financiero" />;
    }
  };

  const getFooterContent = () => {
    if (currentState === 'subform') {
      return (
        <FormModalFooter
          leftContent={
            <Button
              variant="outline"
              onClick={() => setCurrentState('read')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          }
          rightContent={
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Guardar Evento
            </Button>
          }
        />
      );
    }

    if (currentState === 'edit') {
      return (
        <FormModalFooter
          leftContent={
            <Button
              variant="outline"
              onClick={() => setCurrentState('read')}
            >
              Cancelar
            </Button>
          }
          rightContent={
            <div className="flex gap-2">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          }
        />
      );
    }

    return (
      <FormModalFooter
        leftContent={
          <Badge variant="secondary">
            Última modificación: hace 2 días
          </Badge>
        }
        rightContent={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentState('edit')}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentState('subform')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Evento
            </Button>
          </div>
        }
      />
    );
  };

  return (
    <FormModalLayout
      leftPanel={renderLeftPanel()}
      centerPanel={renderCenterPanel()}
      rightPanel={renderRightPanel()}
      onClose={onClose}
      headerContent={getHeaderContent()}
      footerContent={getFooterContent()}
    />
  );
}