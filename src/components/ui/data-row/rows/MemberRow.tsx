import React from 'react';
import DataRowCard from '../DataRowCard';
import { Badge } from "@/components/ui/badge";

// Interface para el miembro (usando la estructura real de la app)
interface Member {
  id: string;
  users?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  roles?: {
    name?: string;
  };
}

interface MemberRowProps {
  member: Member;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

// Helper para obtener las iniciales del miembro
const getMemberInitials = (member: Member): string => {
  const name = member.users?.full_name || member.users?.email || 'U';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

// Helper para obtener el variant del badge del rol
const getRoleBadgeVariant = (roleName: string) => {
  const role = roleName?.toLowerCase() || '';
  if (role.includes('admin')) return 'default';
  if (role.includes('manager') || role.includes('editor')) return 'secondary';
  if (role.includes('viewer') || role.includes('guest')) return 'outline';
  return 'outline';
};

// Helper para obtener la clase CSS del badge del rol
const getRoleBadgeClassName = (roleName: string) => {
  const role = roleName?.toLowerCase() || '';
  if (role.includes('admin')) return 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90';
  return '';
};

export default function MemberRow({ 
  member, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: MemberRowProps) {
  
  // Contenido interno del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido (principal) - solo ocupa el espacio disponible */}
      <div className="flex-1 min-w-0">
        {/* Primera fila - Nombre del miembro */}
        <div className="font-medium text-sm truncate">
          {member.users?.full_name || 'Sin nombre'}
        </div>

        {/* Segunda fila - Email */}
        <div className="text-xs text-muted-foreground truncate">
          {member.users?.email}
        </div>
      </div>

      {/* Columna derecha - Badge del rol */}
      <div className="shrink-0 ml-3">
        <Badge 
          variant={getRoleBadgeVariant(member.roles?.name || '')}
          className={getRoleBadgeClassName(member.roles?.name || '')}
        >
          {member.roles?.name || 'Sin rol'}
        </Badge>
      </div>

      {/* Espacio mínimo para chevron si existe */}
      {onClick && <div className="w-2" />}
    </>
  );

  // Usar el nuevo DataRowCard con avatar del usuario
  return (
    <DataRowCard
      avatarUrl={member.users?.avatar_url}
      avatarFallback={getMemberInitials(member)}
      selected={selected}
      density={density}
      onClick={onClick}
      className={className}
      data-testid={`member-row-${member.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { Member };