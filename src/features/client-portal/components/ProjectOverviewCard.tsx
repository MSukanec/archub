import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Building, Ruler } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClientPortalProject, ClientPortalStats } from '../types';

interface ProjectOverviewCardProps {
  project: ClientPortalProject;
  stats?: ClientPortalStats;
}

export function ProjectOverviewCard({ project, stats }: ProjectOverviewCardProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {project.image_url && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl">
          <img
            src={project.image_url}
            alt={project.name}
            className="w-full h-full object-cover"
            data-testid="img-project-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white" data-testid="text-project-title">
              {project.name}
            </h2>
            <Badge variant="secondary" className="mt-2" data-testid="badge-project-status">
              {project.status}
            </Badge>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card data-testid="card-project-info">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.city && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>
                  {project.city}{project.country ? `, ${project.country}` : ''}
                </span>
              </div>
            )}
            {project.project_type_name && (
              <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{project.project_type_name}</span>
              </div>
            )}
            {project.start_date && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>Inicio: {formatDate(project.start_date)}</span>
              </div>
            )}
            {project.estimated_end && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>Fin estimado: {formatDate(project.estimated_end)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {stats && (
          <Card data-testid="card-financial-summary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Comprometido</span>
                <span className="font-semibold" data-testid="text-total-commitment">
                  {formatCurrency(stats.total_commitment, stats.currency_code)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Pagado</span>
                <span className="font-semibold text-green-600" data-testid="text-total-paid">
                  {formatCurrency(stats.total_paid, stats.currency_code)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Saldo Pendiente</span>
                <span className="font-semibold text-amber-600" data-testid="text-total-pending">
                  {formatCurrency(stats.total_pending, stats.currency_code)}
                </span>
              </div>
              {stats.next_due_date && stats.next_due_amount && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Próximo vencimiento</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{formatDate(stats.next_due_date)}</span>
                    <span className="font-semibold text-primary" data-testid="text-next-due">
                      {formatCurrency(stats.next_due_amount, stats.currency_code)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
