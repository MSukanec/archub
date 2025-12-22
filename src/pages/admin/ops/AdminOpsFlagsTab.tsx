import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Flag, CreditCard, BookOpen, Settings } from 'lucide-react';
import { Table } from '@/components/shared/table';
import type { Column } from '@/components/shared/table';
import type { FeatureFlag } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Flag; color: string }> = {
  subscriptions: { label: 'Suscripciones', icon: CreditCard, color: 'bg-blue-500/10 text-blue-500' },
  courses: { label: 'Cursos', icon: BookOpen, color: 'bg-green-500/10 text-green-500' },
  payments: { label: 'Pagos', icon: CreditCard, color: 'bg-purple-500/10 text-purple-500' },
  general: { label: 'General', icon: Settings, color: 'bg-gray-500/10 text-gray-500' },
};

export default function AdminOpsFlagsTab() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: '', description: '', category: 'general' });

  const { data: flags = [], isLoading } = useQuery<FeatureFlag[]>({
    queryKey: ['/api/admin/ops/feature-flags'],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const res = await apiRequest('PATCH', `/api/admin/ops/feature-flags/${id}`, { value });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Flag actualizado', 
        description: `${data.key} ahora está ${data.value ? 'activado' : 'desactivado'}` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/feature-flags'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { key: string; description: string; category: string }) => {
      const res = await apiRequest('POST', '/api/admin/ops/feature-flags', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Flag creado' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/feature-flags'] });
      setCreateDialogOpen(false);
      setNewFlag({ key: '', description: '', category: 'general' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/ops/feature-flags/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Flag eliminado' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/feature-flags'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const columns: Column<FeatureFlag>[] = useMemo(() => [
    {
      key: 'key',
      label: 'Flag',
      sortable: true,
      width: 'minmax(200px, 2fr)',
      render: (flag) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-sm font-medium">{flag.key}</span>
          {flag.description && (
            <span className="text-xs text-muted-foreground">{flag.description}</span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Categoría',
      sortable: true,
      width: 'minmax(120px, 1fr)',
      render: (flag) => {
        const config = CATEGORY_CONFIG[flag.category || 'general'] || CATEGORY_CONFIG.general;
        const Icon = config.icon;
        return (
          <Badge variant="secondary" className={config.color}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'value',
      label: 'Estado',
      sortable: true,
      width: 'minmax(100px, 0.8fr)',
      align: 'center',
      render: (flag) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={flag.value}
            onCheckedChange={(checked) => updateMutation.mutate({ id: flag.id, value: checked })}
            disabled={updateMutation.isPending}
            data-testid={`switch-flag-${flag.key}`}
          />
          <span className={`text-xs font-medium ${flag.value ? 'text-positive' : 'text-negative'}`}>
            {flag.value ? 'ON' : 'OFF'}
          </span>
        </div>
      ),
    },
  ], [updateMutation]);

  return (
    <div className="space-y-6" data-testid="admin-ops-flags-tab">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Feature Flags</h3>
          <p className="text-sm text-muted-foreground">
            Activa o desactiva funcionalidades sin hacer deploy
          </p>
        </div>
        <Button 
          onClick={() => setCreateDialogOpen(true)} 
          size="sm"
          data-testid="button-create-flag"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Flag
        </Button>
      </div>

      <Table
        columns={columns}
        data={flags}
        isLoading={isLoading}
        emptyStateConfig={{
          icon: <Flag className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay flags',
          description: 'Crea tu primer feature flag para controlar funcionalidades.',
        }}
        defaultSort={{ key: 'category', direction: 'asc' }}
        rowActions={(flag: FeatureFlag) => [
          {
            label: 'Eliminar',
            icon: Trash2,
            onClick: () => deleteMutation.mutate(flag.id),
            variant: 'destructive' as const,
          },
        ]}
      />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Feature Flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key (identificador)</Label>
              <Input
                id="key"
                placeholder="pro_purchases_enabled"
                value={newFlag.key}
                onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                data-testid="input-flag-key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                placeholder="Habilita la compra del plan PRO"
                value={newFlag.description}
                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                data-testid="input-flag-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={newFlag.category}
                onValueChange={(value) => setNewFlag({ ...newFlag, category: value })}
              >
                <SelectTrigger data-testid="select-flag-category">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscriptions">Suscripciones</SelectItem>
                  <SelectItem value="courses">Cursos</SelectItem>
                  <SelectItem value="payments">Pagos</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate(newFlag)}
              disabled={!newFlag.key || createMutation.isPending}
              data-testid="button-submit-flag"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
