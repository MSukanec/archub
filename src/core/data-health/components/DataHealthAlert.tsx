import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DataHealthAlertProps {
  affectedCount: number;
  entityLabel?: string;
  isFiltering: boolean;
  onToggleFilter: () => void;
  showClearButton?: boolean;
}

export function DataHealthAlert({
  affectedCount,
  entityLabel = 'elemento',
  isFiltering,
  onToggleFilter,
  showClearButton = false,
}: DataHealthAlertProps) {
  if (affectedCount === 0) return null;

  const pluralSuffix = affectedCount !== 1 ? 's' : '';
  const entityText = `${affectedCount} ${entityLabel}${pluralSuffix}`;

  return (
    <Alert 
      variant="default" 
      className={`
        cursor-pointer transition-all
        bg-[hsl(var(--chart-negative)/0.08)]
        border-[hsl(var(--chart-negative)/0.25)]
        hover:bg-[hsl(var(--chart-negative)/0.12)]
        ${isFiltering ? 'ring-2 ring-[hsl(var(--chart-negative)/0.4)]' : ''}
      `}
      onClick={onToggleFilter}
      data-testid="data-health-alert"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-[hsl(var(--chart-negative)/0.15)]">
            <AlertTriangle className="h-4 w-4 text-chart-negative" />
          </div>
          <AlertDescription className="text-sm">
            <span className="font-medium text-chart-negative">
              {entityText} con problemas
            </span>
            <span className="text-muted-foreground ml-2">
              {isFiltering ? '(mostrando solo problemáticos)' : '- Click para filtrar'}
            </span>
          </AlertDescription>
        </div>
        {showClearButton && isFiltering && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFilter();
            }}
            data-testid="clear-problems-filter"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}
