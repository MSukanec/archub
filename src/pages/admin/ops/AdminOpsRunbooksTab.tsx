import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface Runbook {
  id: string;
  alert_type: string;
  title: string;
  steps_md: string;
  links: Array<{ label: string; url: string }>;
}

const DEFAULT_RUNBOOKS = [
  {
    alert_type: 'payment.approved_but_not_applied',
    title: 'Pago aprobado pero plan no aplicado',
    steps: [
      '1. Verificar en Supabase que el pago existe en `payments` con status `approved`',
      '2. Verificar el `product_id` del pago (debería ser el UUID del plan)',
      '3. Comparar con `organizations.plan_id`',
      '4. Si no coinciden, actualizar `organizations.plan_id` manualmente',
      '5. Crear billing_cycle si es necesario',
      '6. Marcar alerta como resuelta'
    ]
  },
  {
    alert_type: 'webhook.stuck_received',
    title: 'Webhook atascado en RECEIVED',
    steps: [
      '1. Revisar logs del servidor al momento del webhook',
      '2. Verificar que el custom_id del evento es válido',
      '3. Intentar reprocesar manualmente si es posible',
      '4. Si el pago ya fue procesado por otro evento, marcar como descartado',
      '5. Si requiere acción, procesar y marcar como resuelto'
    ]
  },
  {
    alert_type: 'job.failed',
    title: 'Job del sistema falló',
    steps: [
      '1. Revisar el error_message del job',
      '2. Verificar logs del servidor',
      '3. Si es transitorio, ejecutar manualmente',
      '4. Si es un bug, reportar y arreglar',
      '5. Marcar alerta como resuelta'
    ]
  }
];

export default function AdminOpsRunbooksTab() {
  const { data: runbooks = [], isLoading } = useQuery<Runbook[]>({
    queryKey: ['/api/admin/ops/runbooks'],
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando runbooks...</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Guías de resolución para cada tipo de alerta.
      </p>
      
      {DEFAULT_RUNBOOKS.map((rb) => {
        const saved = runbooks.find(r => r.alert_type === rb.alert_type);
        return (
          <Card key={rb.alert_type} data-testid={`runbook-${rb.alert_type}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {rb.title}
              </CardTitle>
              <CardDescription>
                <code className="text-xs">{rb.alert_type}</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                {(saved?.steps_md || rb.steps.join('\n')).split('\n').map((step, i) => (
                  <p key={i} className="text-muted-foreground">{step}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
