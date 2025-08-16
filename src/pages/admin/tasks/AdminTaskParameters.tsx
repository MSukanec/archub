import { useState } from 'react';
import { Settings, Plus, Edit, Trash2, List } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { Layout } from '@/components/layout/desktop/Layout';

import { Table } from '@/components/ui-custom/Table';
import { EmptyState } from '@/components/ui-custom/EmptyState';

import { useTaskParametersAdmin, useDeleteTaskParameter, useDeleteTaskParameterOption, TaskParameterOption, TaskParameterWithOptions } from '@/hooks/use-task-parameters-admin';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useTopLevelCategories, useUnits } from '@/hooks/use-task-categories';

export default function AdminTaskParameters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [selectedParameterId, setSelectedParameterId] = useState<string>('');
  
  // Global modal store
  const { openModal } = useGlobalModalStore();
  
  const { data: parameters = [], isLoading, error } = useTaskParametersAdmin();
  const deleteParameterMutation = useDeleteTaskParameter();
  const deleteOptionMutation = useDeleteTaskParameterOption();
  
  // Get selected parameter
  const selectedParameter = parameters.find(param => param.id === selectedParameterId);
  
  // Calculate statistics  
  const calculateStats = (parameters: TaskParameterWithOptions[]) => {
    const totalParameters = parameters.length;
    const selectParameters = parameters.filter(p => p.type === 'select').length;
    const totalOptions = parameters.reduce((sum, param) => sum + (param.options?.length || 0), 0);

    return { totalParameters, selectParameters, totalOptions, requiredParameters: 0 };
  };

  const stats = calculateStats(parameters);

  // Filter and sort parameters
  const filteredAndSortedParameters = parameters
    .filter(parameter =>
      (parameter.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (parameter.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.label || '').localeCompare(b.label || '');
        case 'name_desc':
          return (b.label || '').localeCompare(a.label || '');
        case 'type_asc':
          return a.type.localeCompare(b.type);
        case 'type_desc':
          return b.type.localeCompare(a.type);
        default:
          return 0;
      }
    });

  // Render custom filters
  const renderCustomFilters = () => (
    <Select value={sortBy} onValueChange={setSortBy}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Ordenar por..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="name_asc">Nombre A-Z</SelectItem>
        <SelectItem value="name_desc">Nombre Z-A</SelectItem>
        <SelectItem value="type_asc">Tipo A-Z</SelectItem>
        <SelectItem value="type_desc">Tipo Z-A</SelectItem>
      </SelectContent>
    </Select>
  );

  if (isLoading) {
    return (
      <Layout wide={true}>
        <div className="p-8 text-center text-muted-foreground">
          Cargando parámetros...
        </div>
      </Layout>
    );
  }

  // Parameter Values Table Component
  function ParameterValuesTable({ parameterId }: { parameterId: string }) {
    const parameter = filteredAndSortedParameters.find(p => p.id === parameterId);
    const parameterValues = parameter?.options || [];
    
    // Fetch categories and units for display
    const { data: categories = [] } = useTopLevelCategories();
    const { data: units = [] } = useUnits();
    
    // Check if this is the "Tipo de Tarea" parameter
    const isTipoTareaParameter = parameterId === '42d5048d-e839-496d-ad6c-9d185002eee8';

    if (!parameter) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Selecciona un parámetro para ver sus opciones
        </div>
      );
    }

    if (parameterValues.length === 0) {
      return (
        <EmptyState
          icon={<Settings className="w-8 h-8 text-muted-foreground" />}
          title="No hay opciones en este parámetro"
          description="Comienza agregando la primera opción para este parámetro"
        />
      );
    }

    // CustomTable columns for parameter values
    const columns = [
      {
        key: 'label',
        label: 'Nombre (visible)',
        render: (value: TaskParameterOption) => (
          <div className="font-medium text-sm">{value.label}</div>
        )
      },
      {
        key: 'description',
        label: 'Descripción',
        render: (value: TaskParameterOption) => (
          <div className="text-sm text-muted-foreground">
            {value.description || 'Sin descripción'}
          </div>
        )
      },
      ...(isTipoTareaParameter ? [
        {
          key: 'unit_id',
          label: 'Unidad',
          render: (value: TaskParameterOption) => {
            const unit = units.find(u => u.id === value.unit_id);
            return (
              <div className="text-sm">
                {unit ? (
                  <Badge variant="outline" className="text-xs">
                    {unit.abbreviation || unit.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Sin unidad</span>
                )}
              </div>
            );
          }
        },
        {
          key: 'category_id',
          label: 'Categoría',
          render: (value: TaskParameterOption) => {
            const category = categories.find(c => c.id === value.category_id);
            return (
              <div className="text-sm">
                {category ? (
                  <Badge variant="secondary" className="text-xs">
                    {category.code} - {category.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Sin categoría</span>
                )}
              </div>
            );
          }
        }
      ] : []),
      {
        key: 'name',
        label: 'Slug',
        render: (value: TaskParameterOption) => (
          <div className="text-sm text-muted-foreground">{value.name}</div>
        )
      },
      {
        key: 'actions',
        label: 'Acciones',
        render: (value: TaskParameterOption) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => {
                openModal('task-parameter-option', {
                  parameterId: parameter.id,
                  parameterLabel: parameter.label,
                  option: value
                });
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => {
                openModal('delete-confirmation', {
                  title: 'Eliminar Opción',
                  description: '¿Estás seguro de que deseas eliminar esta opción?',
                  itemName: value.label,
                  onConfirm: () => {
                    deleteOptionMutation.mutate(value.id);
                  }
                });
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ),
        sortable: false
      }
    ];

    return (
      <Table
        data={parameterValues}
        columns={columns}
      />
    );
  }

  const headerProps = {
    title: 'Parámetros de Tareas',
    showSearch: true,
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    customFilters: renderCustomFilters(),
    actionButton: {
      label: "Nuevo Parámetro",
      icon: Plus,
      onClick: () => openModal('task-parameter', {
        onParameterCreated: (parameterId: string) => {
          setSelectedParameterId(parameterId);
        }
      }),
      additionalButton: filteredAndSortedParameters.length > 0 && selectedParameter ? {
        label: "Agregar Opción",
        icon: Plus,
        onClick: () => {
          if (selectedParameter) {
            openModal('task-parameter-option', {
              parameterId: selectedParameter.id,
              parameterLabel: selectedParameter.label
            });
          }
        },
        variant: "ghost" as const
      } : undefined
    }
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {filteredAndSortedParameters.length === 0 ? (
          <EmptyState
            icon={<Settings className="w-12 h-12 text-muted-foreground" />}
            title={searchTerm ? "No se encontraron parámetros" : "No hay parámetros creados"}
            description={searchTerm 
              ? 'Prueba ajustando los filtros de búsqueda' 
              : 'Comienza creando tu primer parámetro para gestionar las opciones de tareas'
            }
          />
        ) : (
          <>
            {/* Parameter Selection Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Seleccionar Parámetro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="parameter-select">Parámetro</Label>
                      <Select
                        value={selectedParameterId}
                        onValueChange={setSelectedParameterId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un parámetro para ver sus opciones" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredAndSortedParameters.map((parameter) => (
                            <SelectItem key={parameter.id} value={parameter.id}>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {parameter.type}
                                </Badge>
                                {parameter.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedParameter && (
                      <div className="flex flex-col justify-end">
                        <div className="bg-muted/30 rounded-lg p-3 border border-dashed">
                          <div className="text-sm text-muted-foreground mb-1">
                            Parámetro seleccionado:
                          </div>
                          <div className="font-medium">
                            {selectedParameter.label}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Slug: {selectedParameter.slug} | Tipo: {selectedParameter.type}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parameter Values Table */}
            {selectedParameter ? (
              <ParameterValuesTable parameterId={selectedParameter.id} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <div className="text-lg font-medium mb-2">
                  Selecciona un parámetro
                </div>
                <div>
                  Utiliza el selector de arriba para elegir un parámetro y ver sus opciones
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* All modals now managed by ModalFactory */}
    </Layout>
  );
}