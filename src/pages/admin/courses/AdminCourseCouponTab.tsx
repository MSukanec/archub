import { Button } from '@/components/ui/button'
import { Tag, Plus, Search, Filter, Bell, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import AdminCourseCouponRow from '@/components/ui/data-row/rows/AdminCourseCouponRow'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'
import { useEffect, useState, useMemo } from 'react'

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
  const isMobile = useMobile()
  
  const { 
    setActions, 
    setShowActionBar, 
    clearActions,
    setFilterConfig,
    searchValue: mobileSearchValue,
    setSearchValue: setMobileSearchValue
  } = useActionBarMobile()

  const [searchValue, setSearchValue] = useState("")
  const [filterByStatus, setFilterByStatus] = useState("all")
  const [filterByType, setFilterByType] = useState("all")

  // Sync search values between mobile and desktop
  useEffect(() => {
    if (isMobile && mobileSearchValue !== searchValue) {
      setSearchValue(mobileSearchValue)
    }
  }, [mobileSearchValue, isMobile])
  
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

  // Get coupon status helper
  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date()
    const isExpired = coupon.expires_at && new Date(coupon.expires_at) < now
    const notStarted = coupon.starts_at && new Date(coupon.starts_at) > now
    const limitReached = coupon.max_redemptions && (coupon.total_uses || 0) >= coupon.max_redemptions

    if (!coupon.is_active) return 'inactive'
    if (isExpired) return 'expired'
    if (notStarted) return 'scheduled'
    if (limitReached) return 'limit_reached'
    return 'active'
  }

  // Filter coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter(coupon => {
      // Search filter
      if (searchValue) {
        const search = searchValue.toLowerCase()
        const code = coupon.code?.toLowerCase() || ''
        
        if (!code.includes(search)) {
          return false
        }
      }

      // Status filter
      if (filterByStatus !== "all") {
        const status = getCouponStatus(coupon)
        if (status !== filterByStatus) {
          return false
        }
      }

      // Type filter
      if (filterByType !== "all" && coupon.type !== filterByType) {
        return false
      }

      return true
    })
  }, [coupons, searchValue, filterByStatus, filterByType])

  // Configure mobile action bar
  useEffect(() => {
    if (isMobile) {
      setActions({
        search: {
          id: 'search',
          icon: Search,
          label: 'Buscar',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
        create: {
          id: 'create',
          icon: Plus,
          label: 'Crear Cupón',
          onClick: () => handleCreateCoupon(),
          variant: 'primary'
        },
        filter: {
          id: 'filter',
          icon: Filter,
          label: 'Filtros',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
        notifications: {
          id: 'notifications',
          icon: Bell,
          label: 'Notificaciones',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
      })
      setShowActionBar(true)
    }

    // Cleanup when component unmounts
    return () => {
      if (isMobile) {
        clearActions()
      }
    }
  }, [isMobile, setActions, setShowActionBar, clearActions])

  // Separate effect for filter configuration
  useEffect(() => {
    if (isMobile) {
      setFilterConfig({
        filters: [
          {
            label: 'Filtrar por estado',
            value: filterByStatus,
            onChange: setFilterByStatus,
            placeholder: 'Todos los estados',
            allOptionLabel: 'Todos los estados',
            options: [
              { value: 'active', label: 'Activo' },
              { value: 'inactive', label: 'Inactivo' },
              { value: 'expired', label: 'Vencido' },
              { value: 'scheduled', label: 'Programado' },
              { value: 'limit_reached', label: 'Límite alcanzado' }
            ]
          },
          {
            label: 'Filtrar por tipo',
            value: filterByType,
            onChange: setFilterByType,
            placeholder: 'Todos los tipos',
            allOptionLabel: 'Todos los tipos',
            options: [
              { value: 'percent', label: 'Porcentaje' },
              { value: 'fixed', label: 'Monto Fijo' }
            ]
          }
        ],
        onClearFilters: () => {
          setSearchValue("")
          setMobileSearchValue("")
          setFilterByStatus("all")
          setFilterByType("all")
        }
      })
    }
  }, [filterByStatus, filterByType, isMobile])

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
          const session = await supabase?.auth.getSession();
          const token = session?.data.session?.access_token;
          
          if (!token) throw new Error('No authorization token');
          
          const response = await fetch(`/api/admin/coupons/${couponId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete coupon');
          }
          
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
    }
  ];

  return (
    <>
      {filteredCoupons.length > 0 ? (
        <Table
          data={filteredCoupons}
          columns={couponColumns}
          isLoading={couponsLoading}
          rowActions={(coupon) => [
            {
              icon: Edit,
              label: 'Editar',
              onClick: () => handleEditCoupon(coupon)
            },
            {
              icon: Trash2,
              label: 'Eliminar',
              onClick: () => handleDeleteCoupon(coupon.id),
              variant: 'destructive' as const
            }
          ]}
          renderCard={(coupon) => (
            <AdminCourseCouponRow
              coupon={coupon}
              onClick={() => handleEditCoupon(coupon)}
              density="normal"
            />
          )}
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
