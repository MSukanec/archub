import { Calendar as CalendarIcon, Filter, X, Users, FileType } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { useSitelogFiltersStore } from '../stores/useSitelogFiltersStore';
import { ENTRY_TYPE_OPTIONS } from '../constants';

interface SitelogFiltersBarProps {
  siteLogs: any[];
}

export function SitelogFiltersBar({ siteLogs }: SitelogFiltersBarProps) {
  const {
    creator,
    dateRange,
    type,
    setCreatorFilter,
    setDateRange,
    setTypeFilter,
    resetFilters
  } = useSitelogFiltersStore();

  // Extract unique creators from siteLogs
  const creators = useMemo(() => {
    const uniqueCreators = new Map();
    siteLogs.forEach(log => {
      if (log.creator && log.created_by) {
        uniqueCreators.set(log.created_by, {
          id: log.created_by,
          name: log.creator.full_name || 'Usuario sin nombre'
        });
      }
    });
    return Array.from(uniqueCreators.values());
  }, [siteLogs]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (creator.length > 0) count++;
    if (dateRange.from || dateRange.to) count++;
    if (type.length > 0) count++;
    return count;
  }, [creator, dateRange, type]);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Creator Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            data-testid="button-filter-creator"
          >
            <Users className="h-4 w-4" />
            Creador
            {creator.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {creator.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-2">Filtrar por creador</h4>
              <p className="text-xs text-muted-foreground">
                Selecciona uno o más creadores
              </p>
            </div>
            <Separator />
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {creators.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay creadores disponibles
                  </p>
                ) : (
                  creators.map((c) => (
                    <div key={c.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`creator-${c.id}`}
                        checked={creator.includes(c.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCreatorFilter([...creator, c.id]);
                          } else {
                            setCreatorFilter(creator.filter(id => id !== c.id));
                          }
                        }}
                        data-testid={`checkbox-creator-${c.id}`}
                      />
                      <Label
                        htmlFor={`creator-${c.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {c.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            {creator.length > 0 && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setCreatorFilter([])}
                  data-testid="button-clear-creator-filter"
                >
                  Limpiar selección
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Date Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            data-testid="button-filter-date-range"
          >
            <CalendarIcon className="h-4 w-4" />
            Fecha
            {(dateRange.from || dateRange.to) && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3 space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-1">Rango de fechas</h4>
              <p className="text-xs text-muted-foreground">
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, 'dd MMM', { locale: es })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: es })}`
                  : dateRange.from
                  ? `Desde ${format(dateRange.from, 'dd MMM yyyy', { locale: es })}`
                  : dateRange.to
                  ? `Hasta ${format(dateRange.to, 'dd MMM yyyy', { locale: es })}`
                  : 'Selecciona un rango'}
              </p>
            </div>
            <Calendar
              mode="range"
              selected={dateRange as any}
              onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
              numberOfMonths={2}
              locale={es}
            />
            {(dateRange.from || dateRange.to) && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                  data-testid="button-clear-date-filter"
                >
                  Limpiar fechas
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Entry Type Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            data-testid="button-filter-type"
          >
            <FileType className="h-4 w-4" />
            Tipo
            {type.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {type.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-2">Tipo de bitácora</h4>
              <p className="text-xs text-muted-foreground">
                Selecciona uno o más tipos
              </p>
            </div>
            <Separator />
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {ENTRY_TYPE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${option.value}`}
                      checked={type.includes(option.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTypeFilter([...type, option.value]);
                        } else {
                          setTypeFilter(type.filter(t => t !== option.value));
                        }
                      }}
                      data-testid={`checkbox-type-${option.value}`}
                    />
                    <Label
                      htmlFor={`type-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {type.length > 0 && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setTypeFilter([])}
                  data-testid="button-clear-type-filter"
                >
                  Limpiar selección
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={resetFilters}
          data-testid="button-clear-all-filters"
        >
          <X className="h-4 w-4" />
          Limpiar filtros
          <Badge variant="destructive" className="ml-1 h-5 px-1.5">
            {activeFiltersCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
