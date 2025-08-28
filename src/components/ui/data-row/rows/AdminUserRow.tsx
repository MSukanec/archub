import React from 'react';
import DataRowCard from '../DataRowCard';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';
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

// Componente para mostrar fecha de creación del usuario
const UserCreationDate = ({ createdAt }: { createdAt: string }) => {
  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span>{format(new Date(createdAt), 'dd/MM/yy', { locale: es })}</span>
      </div>
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
        {/* Primera fila - Nombre completo */}
        <div className="font-semibold text-sm truncate">
          {user.full_name || 'Sin nombre'}
        </div>

        {/* Segunda fila - Email */}
        <div className="text-xs text-muted-foreground truncate">
          {user.email}
        </div>
      </div>

      {/* Trailing Section - Fecha de creación */}
      <div className="flex items-center">
        <UserCreationDate createdAt={user.created_at} />
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