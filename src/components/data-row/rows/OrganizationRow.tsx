import React from 'react';
import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown } from 'lucide-react';
import { useOrganizationMembers } from '@/hooks/use-organization-members';

// Interface para la organización (usando la estructura real de la app)
interface Organization {
  id: string;
  name: string;
  is_active: boolean;
  is_system?: boolean;
  logo_url?: string;
  created_at: string;
  updated_at?: string;
  plan?: {
    id: string;
    name: string;
    features?: any;
    price?: number;
  };
}

interface OrganizationRowProps {
  organization: Organization;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

// Helper para obtener las iniciales de la organización
const getOrganizationInitials = (orgName: string): string => {
  const words = orgName.trim().split(' ');
  if (words.length > 1) {
    return words.slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
  }
  return orgName.slice(0, 2).toUpperCase();
};

// Helper para formatear el plan como texto con ícono
const formatPlanText = (plan?: Organization['plan']): string => {
  const planName = plan?.name || 'Free';
  return `👑 ${planName}`;
};

// Componente customizado para el trailing con avatares superpuestos
const OrganizationTrailing = ({ organizationId }: { organizationId: string }) => {
  const { data: members = [] } = useOrganizationMembers(organizationId);
  
  if (members.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        Sin miembros
      </div>
    );
  }
  
  return (
    <div className="flex items-center">
      {/* Mostrar hasta 3 avatares superpuestos más grandes */}
      <div className="flex -space-x-2">
        {members.slice(0, 3).map((member, index) => (
          <Avatar 
            key={member.id} 
            className="w-8 h-8 border-2 border-background relative"
            style={{ zIndex: 10 - index }}
          >
            {member.avatar_url ? (
              <AvatarImage 
                src={member.avatar_url} 
                alt={member.full_name || member.email} 
                className="w-full h-full object-cover"
              />
            ) : (
              <AvatarFallback className="text-xs font-medium">
                {(member.full_name || member.email || 'U').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        ))}
        {members.length > 3 && (
          <div 
            className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center relative"
            style={{ zIndex: 7 }}
          >
            <span className="text-xs font-medium text-muted-foreground">
              +{members.length - 3}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function OrganizationRow({ 
  organization, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: OrganizationRowProps) {
  
  // Props para DataRowCard usando el patrón estándar
  const dataRowProps: DataRowCardProps = {
    // Leading - Avatar de la organización
    avatarUrl: organization.logo_url,
    avatarFallback: getOrganizationInitials(organization.name),
    
    // Content - Nombre como título, plan como subtitle
    title: organization.name,
    subtitle: formatPlanText(organization.plan),
    
    // Behavior
    onClick,
    selected,
    density,
    className,
    showChevron: !!onClick,
    'data-testid': `organization-row-${organization.id}`
  };

  // Renderizar DataRowCard base y el trailing customizado encima
  return (
    <div className="relative">
      <DataRowCard {...dataRowProps} />
      
      {/* Trailing customizado con avatares superpuestos */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <div className="flex items-center gap-2">
          <OrganizationTrailing organizationId={organization.id} />
          {/* Espacio para chevron si existe */}
          {onClick && <div className="w-4" />}
        </div>
      </div>
    </div>
  );
}

// Export del tipo para uso externo
export type { Organization };