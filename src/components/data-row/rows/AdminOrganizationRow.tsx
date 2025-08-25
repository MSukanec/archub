import React from 'react';
import DataRowCard from '../DataRowCard';
import { cn } from '@/lib/utils';
import { Star, Crown, Zap } from 'lucide-react';

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
  } | null;
  members_count?: number;
  projects_count?: number;
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

// Componente para mostrar métricas de la organización
const OrganizationMetrics = ({ membersCount, projectsCount }: { membersCount?: number; projectsCount?: number }) => {
  return (
    <div className="text-right space-y-1">
      <div className="text-xs text-muted-foreground">
        {membersCount || 0} {(membersCount || 0) === 1 ? 'miembro' : 'miembros'}
      </div>
      <div className="text-xs text-muted-foreground">
        {projectsCount || 0} {(projectsCount || 0) === 1 ? 'proyecto' : 'proyectos'}
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
  
  // Contenido interno del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <div className="font-semibold text-sm truncate">
          {organization.name}
        </div>

        {/* Plan Badge como subtitle */}
        <div className="mt-1">
          <PlanBadge plan={organization.plan} />
        </div>
      </div>

      {/* Trailing Section - Métricas */}
      <div className="flex items-center">
        <OrganizationMetrics 
          membersCount={organization.members_count} 
          projectsCount={organization.projects_count} 
        />
        {/* Espacio mínimo para chevron si existe */}
        {onClick && <div className="w-2" />}
      </div>
    </>
  );

  // Usar el nuevo DataRowCard
  return (
    <DataRowCard
      avatarUrl={organization.logo_url && organization.logo_url.trim() !== '' ? organization.logo_url : undefined}
      avatarFallback={getOrganizationInitials(organization.name)}
      selected={selected}
      density={density}
      onClick={onClick}
      className={className}
      data-testid={`organization-row-${organization.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { Organization };