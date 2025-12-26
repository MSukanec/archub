import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CheckRun {
  id: string;
  created_at: string;
  check_suite: string;
  status: string;
  duration_ms: number | null;
  stats: Record<string, any>;
  error_message: string | null;
}

export default function AdminOpsHistoryTab() {
  const { data: runs = [], isLoading } = useQuery<CheckRun[]>({
    queryKey: ['/api/admin/ops/check-runs'],
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando historial...</div>;
  }

  return (
    <div className="space-y-2">
      {runs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No hay ejecuciones registradas</p>
          </CardContent>
        </Card>
      ) : (
        runs.map((run) => (
          <Card key={run.id} data-testid={`run-card-${run.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {run.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : run.status === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{run.check_suite}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(run.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                      {run.duration_ms && ` · ${run.duration_ms}ms`}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  {run.stats?.alerts_opened !== undefined && (
                    <p>Alertas creadas: <span className="font-medium">{run.stats.alerts_opened}</span></p>
                  )}
                  {run.stats?.scanned !== undefined && (
                    <p className="text-muted-foreground">Items escaneados: {run.stats.scanned}</p>
                  )}
                </div>
              </div>
              {run.error_message && (
                <p className="text-xs text-red-600 mt-2">{run.error_message}</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
