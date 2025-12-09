import { Layout } from '@/layouts/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FounderDirectory } from '../components/FounderDirectory';
import { FounderEvents } from '../components/FounderEvents';
import { FounderVoting } from '../components/FounderVoting';
import { FounderForum } from '../components/FounderForum';
import { Building2, Calendar, Vote, MessagesSquare } from 'lucide-react';

export function FoundersPortalPage() {
  const { data: userData } = useCurrentUser();
  const organizationName = userData?.organization?.name || 'tu organización';

  return (
    <Layout
      headerProps={{
        icon: Building2,
        title: 'Portal Fundadores',
        description: `Bienvenido, ${organizationName}`,
      }}
    >
      <div className="p-6 space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-[var(--text-default)]">
            Portal de Fundadores
          </h1>
          <p className="text-[var(--text-muted)]">
            Conecta con otras organizaciones fundadoras, participa en eventos y votaciones
          </p>
        </div>

        <Tabs defaultValue="directorio" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="directorio" data-testid="tab-directorio">
              <Building2 className="h-4 w-4 mr-2 hidden sm:inline" />
              Directorio
            </TabsTrigger>
            <TabsTrigger value="eventos" data-testid="tab-eventos">
              <Calendar className="h-4 w-4 mr-2 hidden sm:inline" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="votaciones" data-testid="tab-votaciones">
              <Vote className="h-4 w-4 mr-2 hidden sm:inline" />
              Votaciones
            </TabsTrigger>
            <TabsTrigger value="foro" data-testid="tab-foro">
              <MessagesSquare className="h-4 w-4 mr-2 hidden sm:inline" />
              Foro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="directorio" className="mt-6">
            <FounderDirectory />
          </TabsContent>

          <TabsContent value="eventos" className="mt-6">
            <FounderEvents />
          </TabsContent>

          <TabsContent value="votaciones" className="mt-6">
            <FounderVoting />
          </TabsContent>

          <TabsContent value="foro" className="mt-6">
            <FounderForum />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
