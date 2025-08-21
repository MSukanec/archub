import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface ProjectFilterPopoverProps {
  children: React.ReactNode;
  filterByType: string;
  onFilterByTypeChange: (value: string) => void;
  filterByStatus: string;
  onFilterByStatusChange: (value: string) => void;
  onClearFilters: () => void;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ProjectFilterPopover({
  children,
  filterByType,
  onFilterByTypeChange,
  filterByStatus,
  onFilterByStatusChange,
  onClearFilters,
  className,
  open,
  onOpenChange,
}: ProjectFilterPopoverProps) {
  // Contar filtros activos
  const activeFiltersCount = [
    filterByType !== 'all',
    filterByStatus !== 'all',
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    onClearFilters();
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div className={`relative ${className}`}>
          {children}
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <h4 className="font-semibold">Filtrar proyectos</h4>
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Filtro por Tipo */}
          <div className="space-y-2">
            <Label htmlFor="filter-type" className="text-sm font-medium">
              Tipo de proyecto
            </Label>
            <Select value={filterByType} onValueChange={onFilterByTypeChange}>
              <SelectTrigger id="filter-type">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="vivienda">Vivienda</SelectItem>
                <SelectItem value="obra nueva">Obra Nueva</SelectItem>
                <SelectItem value="remodelacion">Remodelación</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="consultoria">Consultoría</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Modalidad/Estado */}
          <div className="space-y-2">
            <Label htmlFor="filter-status" className="text-sm font-medium">
              Modalidad
            </Label>
            <Select value={filterByStatus} onValueChange={onFilterByStatusChange}>
              <SelectTrigger id="filter-status">
                <SelectValue placeholder="Seleccionar modalidad..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las modalidades</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="planificacion">Planificación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resumen de filtros activos */}
          {activeFiltersCount > 0 && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-2">
                Filtros activos ({activeFiltersCount}):
              </div>
              <div className="flex flex-wrap gap-2">
                {filterByType !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Tipo: {filterByType}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer hover:bg-muted" 
                      onClick={() => onFilterByTypeChange('all')}
                    />
                  </Badge>
                )}
                {filterByStatus !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Modalidad: {filterByStatus}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer hover:bg-muted" 
                      onClick={() => onFilterByStatusChange('all')}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}