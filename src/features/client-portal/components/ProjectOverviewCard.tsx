import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClientPortalProject, ClientPortalStats, ClientPortalClient } from '../types';
interface ProjectOverviewCardProps {
  project: ClientPortalProject;
  stats?: ClientPortalStats;
  client?: ClientPortalClient | null;
}
export function ProjectOverviewCard({ project, stats, client }: ProjectOverviewCardProps) {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "d 'de'MMMM, yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };
  const formatCurrency = (amount: number, symbol: string = '$') => {
    return `${symbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };
  const getClientDisplayName = () => {
    if (!client) return null;
    if (client.full_name) return client.full_name;
    if (client.first_name || client.last_name) {
      return `${client.first_name || ''} ${client.last_name || ''}`.trim();
    }
    return client.email;
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
      {client && (
        <Card data-testid="card-client-info">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium" data-testid="text-client-name">
                  {getClientDisplayName()}
                </p>
                {client.unit && (
                  <p className="text-sm text-muted-foreground">
                    Unidad: {client.unit}
                  </p>
                )}
                {client.role_name && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {client.role_name}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card data-testid="card-project-info">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{project.address}</span>
              </div>
            )}
            {project.city && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{project.city}</span>
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
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Progreso de pagos</span>
                  <span className="text-sm font-medium">{stats.project_progress}%</span>
                </div>
                <Progress value={stats.project_progress} className="h-2" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Comprometido</span>
                <span className="font-semibold" data-testid="text-total-commitment">
                  {formatCurrency(stats.total_commitment, stats.currency_symbol)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Pagado</span>
                <span className="font-semibold text-green-600" data-testid="text-total-paid">
                  {formatCurrency(stats.total_paid, stats.currency_symbol)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Saldo Pendiente</span>
                <span className="font-semibold text-amber-600" data-testid="text-total-pending">
                  {formatCurrency(stats.total_pending, stats.currency_symbol)}
                </span>
              </div>
              {stats.next_installment_date && stats.next_installment_amount && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Próximo vencimiento</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{formatDate(stats.next_installment_date)}</span>
                    <span className="font-semibold text-primary" data-testid="text-next-due">
                      {formatCurrency(stats.next_installment_amount, stats.currency_symbol)}
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
