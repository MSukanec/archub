import { Building2, Calendar, Vote, MessageCircle, ChevronRight, Sparkles } from 'lucide-react';
import { useFounderDirectory, useFounderEvents, useFounderVotes } from '@/features/founders-portal/services';
import { useForumThreads } from '@/features/forum/services';
import { StatCard, StatCardTitle, StatCardValue, StatCardContent } from '@/components';
import { Skeleton } from '@/components/ui/skeleton';

interface FoundersDashboardTabProps {
  onTabChange: (tab: string) => void;
}

function HeroSection() {
  return (
    <div 
      className="relative overflow-hidden rounded-xl p-8 md:p-10"
      style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, #000) 100%)',
        minHeight: '180px',
      }}
      data-testid="hero-founders-dashboard"
    >
      <div className="relative z-10 space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Bienvenido al Portal Fundadores
        </h1>
        <p className="text-white/90 text-base md:text-lg max-w-xl">
          Conecta, colabora y crece con la comunidad de fundadores
        </p>
        <div className="flex items-center gap-2 text-white/70 text-sm mt-4 pt-2 border-t border-white/20">
          <Sparkles className="w-4 h-4" />
          <span>Próximamente: Novedades y anuncios importantes</span>
        </div>
      </div>
      <div 
        className="absolute right-0 top-0 w-1/2 h-full opacity-10"
        style={{
          background: 'radial-gradient(circle at 70% 30%, white 0%, transparent 60%)',
        }}
      />
    </div>
  );
}

interface KPICardProps {
  title: string;
  count: number;
  items: string[];
  icon: React.ReactNode;
  isLoading: boolean;
  onClick: () => void;
  testId: string;
}

function KPICard({ title, count, items, icon, isLoading, onClick, testId }: KPICardProps) {
  if (isLoading) {
    return (
      <StatCard className="min-h-[180px]">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-16 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </StatCard>
    );
  }

  return (
    <StatCard 
      onCardClick={onClick}
      className="min-h-[180px] hover:border-[var(--accent)] transition-colors"
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
          >
            {icon}
          </div>
          <StatCardTitle showArrow={false} className="normal-case tracking-normal text-sm">
            {title}
          </StatCardTitle>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <StatCardValue className="mt-3">{count}</StatCardValue>
      <StatCardContent className="mt-3">
        <ul className="space-y-1.5">
          {items.slice(0, 4).map((item, index) => (
            <li 
              key={index}
              className="text-sm text-[var(--text-muted)] truncate"
            >
              {item}
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-sm text-[var(--text-muted)] italic">
              Sin datos
            </li>
          )}
        </ul>
      </StatCardContent>
    </StatCard>
  );
}

export function FoundersDashboardTab({ onTabChange }: FoundersDashboardTabProps) {
  const { data: organizations, isLoading: isLoadingOrgs } = useFounderDirectory();
  const { data: events, isLoading: isLoadingEvents } = useFounderEvents();
  const { data: votes, isLoading: isLoadingVotes } = useFounderVotes();
  const { data: threadsData, isLoading: isLoadingThreads } = useForumThreads(null, 1, 10);

  // Forum threads are already filtered by user roles on the backend
  const threads = threadsData?.threads || [];

  const orgNames = organizations?.slice(0, 4).map(org => org.name) || [];
  const eventTitles = events?.slice(0, 4).map(event => event.title) || [];
  const voteTitles = votes?.slice(0, 4).map(vote => vote.title) || [];
  const threadTitles = threads.slice(0, 4).map(thread => thread.title) || [];

  return (
    <div className="space-y-6">
      <HeroSection />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Organizaciones"
          count={organizations?.length || 0}
          items={orgNames}
          icon={<Building2 className="w-5 h-5" style={{ color: 'var(--accent)' }} />}
          isLoading={isLoadingOrgs}
          onClick={() => onTabChange('directorio')}
          testId="kpi-card-directorio"
        />
        <KPICard
          title="Eventos"
          count={events?.length || 0}
          items={eventTitles}
          icon={<Calendar className="w-5 h-5" style={{ color: 'var(--accent)' }} />}
          isLoading={isLoadingEvents}
          onClick={() => onTabChange('eventos')}
          testId="kpi-card-eventos"
        />
        <KPICard
          title="Votaciones"
          count={votes?.length || 0}
          items={voteTitles}
          icon={<Vote className="w-5 h-5" style={{ color: 'var(--accent)' }} />}
          isLoading={isLoadingVotes}
          onClick={() => onTabChange('votaciones')}
          testId="kpi-card-votaciones"
        />
        <KPICard
          title="Temas del Foro"
          count={threads.length}
          items={threadTitles}
          icon={<MessageCircle className="w-5 h-5" style={{ color: 'var(--accent)' }} />}
          isLoading={isLoadingThreads}
          onClick={() => onTabChange('foro')}
          testId="kpi-card-foro"
        />
      </div>
    </div>
  );
}
