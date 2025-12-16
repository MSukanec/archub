import { AlertTriangle, X } from 'lucide-react';
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
    <div 
      className={`
        flex items-center justify-between w-full px-4 py-3 rounded-lg cursor-pointer transition-all
        border-warning bg-warning/10 text-warning
        hover:bg-warning/15
        ${isFiltering ? 'ring-2 ring-warning/50' : ''}
      `}
      onClick={onToggleFilter}
      data-testid="data-health-alert"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-4 w-4" />
        <div className="text-sm">
          <span className="font-medium">
            {entityText} con problemas
          </span>
          <span className="text-muted-foreground ml-2">
            {isFiltering ? '(mostrando solo problemáticos)' : '- Click para filtrar'}
          </span>
        </div>
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
  );
}
