import { Button } from '@/components/ui/button'
import { Tag } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TableActionButtons } from '@/components/ui-custom/tables-and-trees/TableActionButtons'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  amount: number;
  is_active: boolean;
  starts_at?: string;
  expires_at?: string;
  max_redemptions?: number;
  per_user_limit?: number;
  min_order_total?: number;
  currency?: string;
  applies_to_all: boolean;
  created_at: string;
  total_uses?: number;
}

export default function AdminCourseCouponTab() {
  const { toast } = useToast()
  const { openModal } = useGlobalModalStore()
  
  const { data: coupons = [], isLoading: couponsLoading, refetch } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          coupon_redemptions(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((coupon: any) => ({
        ...coupon,
        total_uses: coupon.coupon_redemptions?.[0]?.count || 0
      })) as Coupon[];
    }
  });

  const handleCreateCoupon = () => {
    openModal('coupon', {});
  };

  const handleEditCoupon = (coupon: Coupon) => {
    openModal('coupon', { coupon, isEditing: true });
  };

  const handleDeleteCoupon = (couponId: string) => {
    openModal('delete-confirmation', {
      title: '¿Eliminar cupón?',
      description: 'Esta acción no se puede deshacer. El cupón será eliminado permanentemente.',
      onConfirm: async () => {
        try {
          if (!supabase) throw new Error('Supabase not initialized');
          
          const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', couponId);
          
          if (error) throw error;
          
          toast({
            title: 'Cupón eliminado',
            description: 'El cupón se eliminó correctamente.'
          });
          
          refetch();
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message || 'No se pudo eliminar el cupón',
            variant: 'destructive'
          });
        }
      }
    });
  };

  const couponColumns = [
    {
      key: 'code',
      label: 'Código',
      render: (coupon: Coupon) => (
        <div className="font-bold text-sm font-mono">{coupon.code}</div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (coupon: Coupon) => (
        <div className="text-sm">
          {coupon.type === 'percent' ? 'Porcentaje' : 'Monto Fijo'}
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Importe del cupón',
      render: (coupon: Coupon) => (
        <div className="text-sm font-medium">
          {coupon.type === 'percent' ? `${coupon.amount}%` : `$${coupon.amount}`}
        </div>
      )
    },
    {
      key: 'usage',
      label: 'Usos / Límite',
      render: (coupon: Coupon) => (
        <div className="text-sm">
          {coupon.max_redemptions 
            ? `${coupon.total_uses || 0} / ${coupon.max_redemptions}` 
            : `${coupon.total_uses || 0} / ∞`}
        </div>
      )
    },
    {
      key: 'is_active',
      label: 'Estado',
      render: (coupon: Coupon) => {
        const now = new Date();
        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < now;
        const notStarted = coupon.starts_at && new Date(coupon.starts_at) > now;
        const limitReached = coupon.max_redemptions && (coupon.total_uses || 0) >= coupon.max_redemptions;

        let status = 'Activo';
        let color = 'var(--accent)';
        
        if (!coupon.is_active) {
          status = 'Inactivo';
          color = '#6b7280';
        } else if (isExpired) {
          status = 'Vencido';
          color = '#ef4444';
        } else if (notStarted) {
          status = 'Programado';
          color = '#f59e0b';
        } else if (limitReached) {
          status = 'Límite alcanzado';
          color = '#ef4444';
        }

        return (
          <Badge style={{ backgroundColor: color, color: 'white' }}>
            {status}
          </Badge>
        );
      }
    },
    {
      key: 'validity',
      label: 'Fecha de caducidad',
      render: (coupon: Coupon) => (
        <div className="text-sm text-muted-foreground">
          {coupon.expires_at 
            ? format(new Date(coupon.expires_at), 'dd/MM/yyyy', { locale: es })
            : 'Sin vencimiento'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (coupon: Coupon) => (
        <TableActionButtons
          onEdit={() => handleEditCoupon(coupon)}
          onDelete={() => handleDeleteCoupon(coupon.id)}
        />
      )
    }
  ];

  return (
    <>
      {coupons.length > 0 ? (
        <Table
          data={coupons}
          columns={couponColumns}
          isLoading={couponsLoading}
          emptyState={
            <EmptyState
              icon={<Tag className="w-12 h-12" />}
              title="No hay cupones"
              description="Comienza creando tu primer cupón de descuento"
            />
          }
        />
      ) : (
        <EmptyState
          icon={<Tag className="w-12 h-12" />}
          title="No hay cupones creados"
          description="Comienza creando cupones de descuento para tus cursos"
          action={
            <Button onClick={handleCreateCoupon} data-testid="button-create-coupon-empty">
              Crear Primer Cupón
            </Button>
          }
        />
      )}
    </>
  )
}
