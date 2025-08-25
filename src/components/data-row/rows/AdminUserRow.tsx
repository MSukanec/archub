import React from 'react';
import DataRowCard from '../DataRowCard';
import { cn } from '@/lib/utils';
import { Building, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interface para el usuario (usando la estructura real de la app)
interface User {
  id: string;
  auth_id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  created_at: string;
  is_active: boolean;
  user_data?: {
    first_name: string;
    last_name: string;
    country: string;
  };
  organizations_count: number;
  last_activity_at: string;
}

interface AdminUserRowProps {
  user: User;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

// Helper para obtener las iniciales del usuario
const getUserInitials = (user: User): string => {
  if (user.full_name) {
    const names = user.full_name.trim().split(' ');
    if (names.length > 1) {
      return names.slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
    }
    return user.full_name.slice(0, 2).toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
};

// Componente para mostrar métricas del usuario
const UserMetrics = ({ organizationsCount, lastActivity }: { organizationsCount: number; lastActivity: string }) => {
  return (
    <div className="text-right space-y-1">
      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <Building className="w-3 h-3" />
        <span>{organizationsCount} {organizationsCount === 1 ? 'org' : 'orgs'}</span>
      </div>
      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span>{format(new Date(lastActivity), 'dd/MM/yy', { locale: es })}</span>
      </div>
    </div>
  );
};

// Badge de estado activo/inactivo
const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className={cn(
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
      isActive 
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    )}>
      {isActive ? 'Activo' : 'Inactivo'}
    </div>
  );
};

export default function AdminUserRow({ 
  user, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: AdminUserRowProps) {
  
  // Contenido interno del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Title - Nombre completo o email */}
        <div className="font-semibold text-sm truncate">
          {user.full_name || 'Sin nombre'}
        </div>

        {/* Subtitle - Email */}
        <div className="text-xs text-muted-foreground truncate">
          {user.email}
        </div>

        {/* Status Badge */}
        <div className="mt-1">
          <StatusBadge isActive={user.is_active} />
        </div>
      </div>

      {/* Trailing Section - Métricas */}
      <div className="flex items-center">
        <UserMetrics 
          organizationsCount={user.organizations_count} 
          lastActivity={user.last_activity_at} 
        />
        {/* Espacio mínimo para chevron si existe */}
        {onClick && <div className="w-2" />}
      </div>
    </>
  );

  // Usar el nuevo DataRowCard
  return (
    <DataRowCard
      avatarUrl={user.avatar_url && user.avatar_url.trim() !== '' ? user.avatar_url : undefined}
      avatarFallback={getUserInitials(user)}
      selected={selected}
      density={density}
      onClick={onClick}
      className={className}
      data-testid={`user-row-${user.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { User };