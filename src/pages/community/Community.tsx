import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/desktop/Layout';
import { useNavigationStore } from '@/stores/navigationStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, Folder, Users, TrendingUp, Building2 } from 'lucide-react';
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CommunityStats {
  totalOrganizations: number;
  totalProjects: number;
  totalMembers: number;
}

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

interface ActiveUser {
  id: string;
  name: string;
  avatar_url: string | null;
  last_activity: string;
  current_page: string | null;
}

export default function Community() {
  const { setSidebarLevel } = useNavigationStore();

  useEffect(() => {
    setSidebarLevel('community');
  }, [setSidebarLevel]);

  const headerProps = {
    title: "Comunidad",
    icon: Users,
    description: "Conecta con otros profesionales de la construcción",
    showSearch: false,
    showFilters: false,
  };

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<CommunityStats>({
    queryKey: ['/api/community/stats'],
  });

  const { data: organizations, isLoading: orgsLoading, error: orgsError } = useQuery<Organization[]>({
    queryKey: ['/api/community/organizations'],
  });

  const { data: activeUsers, isLoading: usersLoading, error: usersError } = useQuery<ActiveUser[]>({
    queryKey: ['/api/community/active-users'],
  });

  const displayedUsers = activeUsers?.slice(0, 10) || [];

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-8 pb-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Building}
            title="Organizaciones"
            value={stats?.totalOrganizations}
            isLoading={statsLoading}
            data-testid="stat-organizations"
          />
          <StatCard
            icon={Folder}
            title="Proyectos"
            value={stats?.totalProjects}
            isLoading={statsLoading}
            data-testid="stat-projects"
          />
          <StatCard
            icon={Users}
            title="Total Miembros"
            value={stats?.totalMembers}
            isLoading={statsLoading}
            data-testid="stat-members"
          />
          <StatCard
            icon={TrendingUp}
            title="Crecimiento"
            value="+12%"
            subtitle="este mes"
            isLoading={false}
            data-testid="stat-growth"
          />
        </div>

        {/* Featured Organizations */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-default)]">
            Organizaciones Destacadas
          </h2>
          {orgsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : orgsError ? (
            <div className="text-center py-12 text-red-500">
              Error al cargar organizaciones. Por favor, intenta nuevamente.
            </div>
          ) : organizations && organizations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {organizations.map((org) => (
                <OrganizationCard key={org.id} organization={org} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)]">
              No hay organizaciones disponibles
            </div>
          )}
        </div>

        {/* Active Users */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-default)]">
            Usuarios Activos Recientemente
          </h2>
          {usersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : usersError ? (
            <div className="text-center py-12 text-red-500">
              Error al cargar usuarios activos. Por favor, intenta nuevamente.
            </div>
          ) : displayedUsers.length > 0 ? (
            <div className="space-y-3">
              {displayedUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)]">
              No hay usuarios activos en las últimas 24 horas
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value?: number | string;
  subtitle?: string;
  isLoading: boolean;
  'data-testid'?: string;
}

function StatCard({ icon: Icon, title, value, subtitle, isLoading, 'data-testid': dataTestId }: StatCardProps) {
  return (
    <Card className="hover:shadow-xl transition-shadow" data-testid={dataTestId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-[var(--text-muted)] mb-1">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold text-[var(--text-default)]">
                {value ?? 0}
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>
            )}
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--accent-hover)]">
            <Icon className="h-6 w-6 text-[var(--accent)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface OrganizationCardProps {
  organization: Organization;
}

function OrganizationCard({ organization }: OrganizationCardProps) {
  const initials = organization.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer" data-testid={`org-card-${organization.id}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden bg-[var(--accent-hover)]">
            {organization.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={organization.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8 text-[var(--accent)]" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-default)] line-clamp-2">
              {organization.name}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {formatDistanceToNow(new Date(organization.created_at), { addSuffix: true, locale: es })}
            </p>
          </div>
          <Link 
            href={`/organization/${organization.id}`}
            className="text-sm font-medium hover:underline text-[var(--accent)]"
          >
            Ver proyectos
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

interface UserCardProps {
  user: ActiveUser;
}

function UserCard({ user }: UserCardProps) {
  const initials = user.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const timeAgo = formatDistanceToNow(new Date(user.last_activity), { addSuffix: true, locale: es });

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`user-card-${user.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12">
              {user.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={user.name} />
              ) : (
                <AvatarFallback className="text-sm" style={{ backgroundColor: 'var(--accent-hover)', color: 'var(--accent)' }}>
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div 
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
              style={{ backgroundColor: 'var(--accent)' }}
              title="En línea"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-[var(--text-default)] truncate">
              {user.name}
            </h4>
            <p className="text-sm text-[var(--text-muted)] truncate">
              {user.current_page || 'Navegando'}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-xs">
              {timeAgo}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
