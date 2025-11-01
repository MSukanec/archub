import DataRowCard from '../DataRowCard';
import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface AdminCourseCouponRowProps {
  coupon: Coupon;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

// Función para determinar el estado del cupón
const getCouponStatus = (coupon: Coupon) => {
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

  return { status, color };
};

// Componente para mostrar los usos del cupón
const CouponUsage = ({ coupon }: { coupon: Coupon }) => {
  return (
    <div className="text-right">
      <div className="text-xs text-muted-foreground mb-1">
        Usos
      </div>
      <div className="text-xs text-muted-foreground">
        {coupon.max_redemptions 
          ? `${coupon.total_uses || 0} / ${coupon.max_redemptions}` 
          : `${coupon.total_uses || 0} / ∞`}
      </div>
    </div>
  );
};

export default function AdminCourseCouponRow({ 
  coupon, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: AdminCourseCouponRowProps) {
  
  const { status, color } = getCouponStatus(coupon);

  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Primera fila - Código del cupón */}
        <div className="font-bold text-sm font-mono truncate">
          {coupon.code}
        </div>

        {/* Segunda fila - Tipo y descuento */}
        <div className="text-xs text-muted-foreground">
          {coupon.type === 'percent' ? 'Porcentaje' : 'Monto Fijo'} - {' '}
          <span className="font-medium">
            {coupon.type === 'percent' ? `${coupon.amount}%` : `$${coupon.amount}`}
          </span>
        </div>
      </div>

      {/* Trailing Section - Estado y Usos */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {/* Estado */}
        <Badge 
          style={{ 
            backgroundColor: color, 
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px'
          }}
        >
          {status}
        </Badge>
        
        {/* Usos */}
        <CouponUsage coupon={coupon} />
      </div>
    </>
  );

  // Obtener iniciales del código del cupón (primeras 2 letras)
  const getInitials = () => {
    return coupon.code.slice(0, 2).toUpperCase();
  };

  return (
    <DataRowCard
      avatarFallback={getInitials()}
      selected={selected}
      density={density}
      onClick={onClick}
      className={className}
      data-testid={`course-coupon-row-${coupon.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

export type { Coupon };
