import { useState, useEffect, useRef, useMemo } from 'react';
import { Building2, Calendar, Receipt, BookOpen, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ClientPortalTab, ClientPortalProject, ClientPortalSettings } from '../types';
interface Tab {
  id: ClientPortalTab;
  label: string;
  icon: typeof Building2;
  settingsKey: keyof Pick<ClientPortalSettings, 'show_dashboard'| 'show_installments'| 'show_payments'| 'show_logs'>;
}
const PORTAL_TABS: Tab[] = [
  { id: 'dashboard', label: 'Visión General', icon: Building2, settingsKey: 'show_dashboard'},
  { id: 'installments', label: 'Cuotas', icon: Calendar, settingsKey: 'show_installments'},
  { id: 'payments', label: 'Mis Pagos', icon: Receipt, settingsKey: 'show_payments'},
  { id: 'logs', label: 'Avances', icon: BookOpen, settingsKey: 'show_logs'},
];
interface ClientPortalLayoutProps {
  project: ClientPortalProject;
  activeTab: ClientPortalTab;
  onTabChange: (tab: ClientPortalTab) => void;
  children: React.ReactNode;
  isAdminPreview?: boolean;
  adminPreviewSlot?: React.ReactNode;
  settings?: ClientPortalSettings;
}
const DEFAULT_SETTINGS: ClientPortalSettings = {
  show_dashboard: true,
  show_installments: true,
  show_payments: true,
  show_logs: true,
  show_amounts: true,
  show_progress: true,
  allow_comments: false,
};
export function ClientPortalLayout({
  project,
  activeTab,
  onTabChange,
  children,
  isAdminPreview = false,
  adminPreviewSlot,
  settings = DEFAULT_SETTINGS,
}: ClientPortalLayoutProps) {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [underlineStyle, setUnderlineStyle] = useState<{ width: number; left: number }>({ width: 0, left: 0 });
  const visibleTabs = useMemo(() => {
    return PORTAL_TABS.filter(tab => settings[tab.settingsKey]);
  }, [settings]);
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find(t => t.id === activeTab)) {
      onTabChange(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab, onTabChange]);
  useEffect(() => {
    const updateUnderlinePosition = () => {
      if (!tabsContainerRef.current) return;
      
      const tabButton = tabsContainerRef.current?.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
      if (tabButton && tabsContainerRef.current) {
        const tabOffsetLeft = tabButton.offsetLeft;
        const tabWidth = tabButton.offsetWidth;
        const buttonPadding = 4;
        
        const left = tabOffsetLeft + buttonPadding;
        const width = tabWidth - (buttonPadding * 2);
        
        setUnderlineStyle({ width, left });
      }
    };
    
    updateUnderlinePosition();
    requestAnimationFrame(updateUnderlinePosition);
  }, [activeTab, visibleTabs]);
  return (
    <div className="min-h-screen bg-background">
      {isAdminPreview && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-20 py-2">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Vista previa del portal
                </span>
                <Badge variant="outline" className="text-xs">
                  Solo visible para administradores
                </Badge>
              </div>
              {adminPreviewSlot}
            </div>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-20">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {project.image_url && (
                  <img
                    src={project.image_url}
                    alt={project.name}
                    className="h-8 w-8 rounded-md object-cover hidden sm:block"
                  />
                )}
                <div>
                  <h1 className="font-semibold text-sm sm:text-base" data-testid="text-project-name">
                    {project.name}
                  </h1>
                  {project.city && (
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {project.city}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <img 
                src="/seencel-logo-192.png" 
                alt="Seencel" 
                className="h-6 w-auto"
              />
            </div>
          </div>
          {/* Desktop Tabs - Idéntico al dashboard */}
          <div className="hidden sm:block">
            <div className="h-[45px] flex items-center relative overflow-hidden border-t border-border/30">
              <div ref={tabsContainerRef} className="flex items-center relative" style={{ gap: '24px'}}>
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    data-tab-id={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative text-sm flex items-center gap-2 px-1 h-[45px] flex-shrink-0 min-w-0 ${
                      tab.id === activeTab
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                    style={{ 
                      transition: 'none',
                      transform: 'translateZ(0)',
                      willChange: 'auto'
                    }}
                    data-testid={`tab-${tab.id}`}
                  >
                    {tab.label}
                  </button>
                ))}
                
                {/* Subrayado animado con --accent */}
                <div
                  className="absolute bottom-0 h-[2px] bg-[var(--accent)] transition-all duration-300 ease-out pointer-events-none"
                  style={{
                    width: `${underlineStyle.width}px`,
                    transform: `translateX(${underlineStyle.left}px)`,
                    opacity: underlineStyle.width > 0 ? 1 : 0,
                    left: 0
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Mobile Tabs - Chips horizontales scrollables */}
        <div className="sm:hidden border-t border-border/30">
          <div className="px-6 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 
                    transition-all duration-200 flex items-center gap-2
                    ${tab.id === activeTab 
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                    }
                  `}
                  data-testid={`tab-mobile-${tab.id}`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-[1440px] mx-auto px-6 sm:px-20 py-6">
        <main data-testid="client-portal-content">
          {children}
        </main>
      </div>
    </div>
  );
}
