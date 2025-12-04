import { Tabs } from '@/components/ui-custom/Tabs';
import { ArrowLeft, Building2, CreditCard, BookOpen, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import type { ClientPortalTab, ClientPortalProject } from '../types';

interface ClientPortalLayoutProps {
  project: ClientPortalProject;
  activeTab: ClientPortalTab;
  onTabChange: (tab: ClientPortalTab) => void;
  children: React.ReactNode;
  isAdminPreview?: boolean;
  adminPreviewSlot?: React.ReactNode;
}

export function ClientPortalLayout({
  project,
  activeTab,
  onTabChange,
  children,
  isAdminPreview = false,
  adminPreviewSlot,
}: ClientPortalLayoutProps) {
  const tabs = [
    { value: 'dashboard', label: 'Mi Proyecto', icon: Building2 },
    { value: 'payments', label: 'Mis Pagos', icon: CreditCard },
    { value: 'logs', label: 'Avances', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background">
      {isAdminPreview && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={isAdminPreview ? "/home" : "/"}>
                <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Volver</span>
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                {project.image_url && (
                  <img
                    src={project.image_url}
                    alt={project.name}
                    className="h-8 w-8 rounded-md object-cover"
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
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Tabs
            tabs={tabs.map(t => ({ value: t.value, label: t.label }))}
            value={activeTab}
            onValueChange={(value) => onTabChange(value as ClientPortalTab)}
          />
        </div>

        <main data-testid="client-portal-content">
          {children}
        </main>
      </div>
    </div>
  );
}
