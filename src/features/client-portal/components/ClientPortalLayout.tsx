import { useState } from 'react';
import { Tabs } from '@/components/ui-custom/Tabs';
import { ArrowLeft, Building2, CreditCard, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import type { ClientPortalTab, ClientPortalProject } from '../types';

interface ClientPortalLayoutProps {
  project: ClientPortalProject;
  activeTab: ClientPortalTab;
  onTabChange: (tab: ClientPortalTab) => void;
  children: React.ReactNode;
}

export function ClientPortalLayout({
  project,
  activeTab,
  onTabChange,
  children,
}: ClientPortalLayoutProps) {
  const tabs = [
    { value: 'dashboard', label: 'Mi Proyecto', icon: Building2 },
    { value: 'payments', label: 'Mis Pagos', icon: CreditCard },
    { value: 'logs', label: 'Avances', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
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
                      {project.city}{project.country ? `, ${project.country}` : ''}
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
