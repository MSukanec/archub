import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Crown, Zap } from 'lucide-react';
import { useOrganizationMembers } from '@/hooks/use-organization-members';

// Interface para la organización (usando la estructura real de la app)
interface Organization {
  id: string;
  name: string;
  is_active: boolean;
  is_system?: boolean;
  logo_url?: string;
  created_at?: string;
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





// Componente PlanBadge local para mostrar el plan de la organización
const PlanBadge = ({ plan }: { plan?: Organization['plan'] }) => {
  const planName = plan?.name?.toLowerCase() || 'free';
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white',
      planName === 'free' ? 'bg-[var(--plan-free-bg)]' : '',
      planName === 'pro' ? 'bg-[var(--plan-pro-bg)]' : '',
      planName === 'teams' ? 'bg-[var(--plan-teams-bg)]' : ''
    )}>
      {planName === 'free' && <Star className="w-3 h-3" />}
      {planName === 'pro' && <Crown className="w-3 h-3" />}
      {planName === 'teams' && <Zap className="w-3 h-3" />}
      <span className="capitalize">{plan?.name || 'Free'}</span>
    </div>
  );
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
        {/* Mostrar contador "+X" al INICIO si hay más de 3 miembros */}
        {members.length > 3 && (
          <div 
            className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center relative"
            style={{ zIndex: 13 }}
          >
            <span className="text-xs font-medium text-muted-foreground">
              +{members.length - 3}
            </span>
          </div>
        )}
        {/* Mostrar los primeros 3 avatares */}
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
  
  // Debug log para ver los datos de la organización
  console.log(`OrganizationRow - ${organization.name}:`, {
    logo_url: organization.logo_url,
    has_logo: !!organization.logo_url,
    logo_length: organization.logo_url?.length
  });
  
  // Renderizar un DataRowCard customizado sin positioning absoluto
  return (
    <div
      className={cn(
        'w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 mb-3 transition-colors shadow-lg',
        'py-3 gap-3',
        // Estados interactivos
        onClick && 'cursor-pointer hover:bg-[var(--card-hover-bg)] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        // Estado selected
        selected && 'ring-2 ring-accent',
        className
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      data-testid={`organization-row-${organization.id}`}
    >
      <div className="flex items-center gap-3">
        {/* Leading Section - Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-10 w-10">
            {organization.logo_url && organization.logo_url.trim() !== '' && (
              <AvatarImage 
                src={organization.logo_url} 
                alt={`Logo de ${organization.name}`}
                className="object-cover"
                onError={() => console.log(`Failed to load logo for ${organization.name}:`, organization.logo_url)}
                onLoad={() => console.log(`Successfully loaded logo for ${organization.name}`)}
              />
            )}
            <AvatarFallback className="text-xs font-medium">
              {getOrganizationInitials(organization.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="truncate leading-5 font-bold text-sm">
            {organization.name}
          </div>

          {/* Plan Badge como subtitle */}
          <div className="mt-1">
            <PlanBadge plan={organization.plan} />
          </div>
        </div>

        {/* Trailing Section - Avatares */}
        <div className="flex items-center">
          <OrganizationTrailing organizationId={organization.id} />
          {/* Espacio mínimo para chevron si existe */}
          {onClick && <div className="w-2" />}
        </div>
      </div>
    </div>
  );
}

// Export del tipo para uso externo
export type { Organization };