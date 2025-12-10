import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, MapPin, Users } from 'lucide-react';
import { useFounderDirectory, type FounderOrganization } from '../services';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

function OrganizationCard({ org }: { org: FounderOrganization }) {
  const country = org.settings?.country;
  
  return (
    <Card 
      className="hover:shadow-lg transition-shadow"
      data-testid={`card-organization-${org.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-full">
            <AvatarImage src={org.logo_url || undefined} alt={org.name} />
            <AvatarFallback className="rounded-full bg-accent/10 text-accent">
              {getInitials(org.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-[var(--text-default)] truncate">
              {org.name}
            </h3>
            
            {org.creator_name && (
              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                {org.creator_name}
              </p>
            )}
            
            {country && (
              <div className="flex items-center gap-1 mt-1.5 text-xs text-[var(--text-muted)]">
                <MapPin className="h-3 w-3" />
                <span>{country}</span>
              </div>
            )}
            
            {org.member_count !== undefined && (
              <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-muted)]">
                <Users className="h-3 w-3" />
                <span>{org.member_count} miembros</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DirectorySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-14 w-14 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FounderDirectory() {
  const { data: organizations, isLoading, error } = useFounderDirectory();

  if (isLoading) {
    return <DirectorySkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)]">
        Error al cargar el directorio
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3" />
        <p className="text-[var(--text-muted)]">
          No hay organizaciones fundadoras registradas
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {organizations.map((org) => (
        <OrganizationCard key={org.id} org={org} />
      ))}
    </div>
  );
}
