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
      className="flex items-center justify-between w-full px-4 py-3 rounded-lg cursor-pointer transition-all border"
      style={{
        backgroundColor: 'hsl(var(--warning) / 0.10)',
        borderColor: 'hsl(var(--warning) / 0.30)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'hsl(var(--warning) / 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'hsl(var(--warning) / 0.10)';
      }}
      onClick={onToggleFilter}
      data-testid="data-health-alert"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md" style={{ backgroundColor: 'hsl(var(--warning) / 0.15)' }}>
          <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--warning))' }} />
        </div>
        <div className="text-sm">
          <span className="font-medium" style={{ color: 'hsl(var(--warning))' }}>
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
