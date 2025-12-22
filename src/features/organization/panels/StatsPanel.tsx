import { Folder, Users, FileText, Users2 } from 'lucide-react';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';

interface StatsPanelProps {
  projectsCount: number;
  activeProjectsCount: number;
  contactsCount: number;
  siteLogsCount: number;
  teamCount: number;
  isLoading: boolean;
}

export function StatsPanel({
  projectsCount,
  activeProjectsCount,
  contactsCount,
  siteLogsCount,
  teamCount,
  isLoading,
}: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard href="/organization/projects" data-testid="stat-card-proyectos-activos">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <StatCardTitle>Proyectos Activos</StatCardTitle>
            <StatCardValue className="mt-2">
              {isLoading ? '-' : activeProjectsCount}
            </StatCardValue>
            <StatCardMeta>
              {isLoading ? 'Cargando...' : `de ${projectsCount} totales`}
            </StatCardMeta>
          </div>
          <Folder className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
        </div>
      </StatCard>

      <StatCard href="/contacts" data-testid="stat-card-contactos">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <StatCardTitle>Contactos</StatCardTitle>
            <StatCardValue className="mt-2">
              {isLoading ? '-' : contactsCount}
            </StatCardValue>
            <StatCardMeta>
              {isLoading ? 'Cargando...' : 'Personal y clientes'}
            </StatCardMeta>
          </div>
          <Users className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
        </div>
      </StatCard>

      <StatCard data-testid="stat-card-bitacoras-org">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <StatCardTitle>Bitácoras</StatCardTitle>
            <StatCardValue className="mt-2">
              {isLoading ? '-' : siteLogsCount}
            </StatCardValue>
            <StatCardMeta>
              {isLoading ? 'Cargando...' : 'Registros totales'}
            </StatCardMeta>
          </div>
          <FileText className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
        </div>
      </StatCard>

      <StatCard data-testid="stat-card-equipo" className="opacity-75 cursor-default hover:shadow-none">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <StatCardTitle>Equipo</StatCardTitle>
            <StatCardValue className="mt-2">
              {isLoading ? '-' : teamCount}
            </StatCardValue>
            <StatCardMeta>
              {isLoading ? 'Cargando...' : 'Miembros activos'}
            </StatCardMeta>
          </div>
          <Users2 className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
        </div>
      </StatCard>
    </div>
  );
}
