import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

interface SubcontractBidFormModalProps {
  subcontract_id: string;
  bid_id?: string;
  mode: 'create' | 'edit';
  initialData?: any;
  onClose: () => void;
}

export function SubcontractBidFormModal({
  subcontract_id,
  bid_id,
  mode,
  initialData,
  onClose
}: SubcontractBidFormModalProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_email: '',
    supplier_phone: '',
    status: 'pending',
    total_amount: '',
    currency_code: 'ARS',
    is_lump_sum: true,
    received_at: '',
    notes: '',
    task_prices: [] as Array<{
      task_id: string;
      unit_price: number;
      notes: string;
    }>
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        supplier_name: initialData.supplier_name || '',
        supplier_email: initialData.supplier_email || '',
        supplier_phone: initialData.supplier_phone || '',
        status: initialData.status || 'pending',
        total_amount: initialData.total_amount?.toString() || '',
        currency_code: initialData.currency_code || 'ARS',
        is_lump_sum: initialData.is_lump_sum ?? true,
        received_at: initialData.received_at ? new Date(initialData.received_at).toISOString().slice(0, 16) : '',
        notes: initialData.notes || '',
        task_prices: initialData.task_prices || []
      });
    }
  }, [mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implementar guardado de oferta
      console.log('Saving bid:', {
        ...formData,
        subcontract_id,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null
      });

      toast({
        title: mode === 'create' ? 'Oferta creada' : 'Oferta actualizada',
        description: 'Los cambios se han guardado correctamente'
      });

      onClose();
    } catch (error) {
      console.error('Error saving bid:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la oferta',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTaskPrice = () => {
    setFormData(prev => ({
      ...prev,
      task_prices: [
        ...prev.task_prices,
        { task_id: '', unit_price: 0, notes: '' }
      ]
    }));
  };

  const removeTaskPrice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      task_prices: prev.task_prices.filter((_, i) => i !== index)
    }));
  };

  const updateTaskPrice = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      task_prices: prev.task_prices.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {mode === 'create' ? 'Nueva Oferta' : 'Editar Oferta'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Registra una oferta de proveedor para este subcontrato
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información del Proveedor */}
        <div className="space-y-4">
          <h3 className="text-md font-medium">Información del Proveedor</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Nombre del Proveedor *</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                placeholder="Ej: Constructora ABC S.A."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_email">Email</Label>
              <Input
                id="supplier_email"
                type="email"
                value={formData.supplier_email}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_email: e.target.value }))}
                placeholder="contacto@constructora.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_phone">Teléfono</Label>
              <Input
                id="supplier_phone"
                value={formData.supplier_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_phone: e.target.value }))}
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="received">Recibida</SelectItem>
                  <SelectItem value="withdrawn">Retirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Información de la Oferta */}
        <div className="space-y-4">
          <h3 className="text-md font-medium">Información de la Oferta</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Monto Total</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency_code">Moneda</Label>
              <Select
                value={formData.currency_code}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency_code: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                  <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="received_at">Fecha de Recepción</Label>
              <Input
                id="received_at"
                type="datetime-local"
                value={formData.received_at}
                onChange={(e) => setFormData(prev => ({ ...prev, received_at: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Comentarios adicionales sobre la oferta..."
              rows={3}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : (mode === 'create' ? 'Crear Oferta' : 'Actualizar Oferta')}
          </Button>
        </div>
      </form>
    </div>
  );
}