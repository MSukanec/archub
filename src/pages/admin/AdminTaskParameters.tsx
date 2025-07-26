import { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, Eye, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// AlertDialog imports removed - now using ModalFactory system
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { Layout } from '@/components/layout/desktop/Layout';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';
import { Table } from '@/components/ui-custom/Table';
import { EmptyState } from '@/components/ui-custom/EmptyState';

import { useTaskParametersAdmin, useDeleteTaskParameter, useDeleteTaskParameterOption, useTaskParameterOptionGroups, useTaskParameterOptionGroupItems, TaskParameter, TaskParameterOption } from '@/hooks/use-task-parameters-admin';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
// Removed NewTaskParameterOptionModal - now using ModalFactory with 'task-parameter-option' type


export default function AdminTaskParameters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [selectedParameterId, setSelectedParameterId] = useState<string>('');
  
  // Global modal store
  const { openModal } = useGlobalModalStore();
  
  // Legacy delete confirmation states removed - now using ModalFactory
  
  // Removed old option modal states - now using ModalFactory

  const { data: parameters = [], isLoading, error } = useTaskParametersAdmin();
  const deleteParameterMutation = useDeleteTaskParameter();
  const deleteOptionMutation = useDeleteTaskParameterOption();
  
  // Get selected parameter
  const selectedParameter = parameters.find(param => param.id === selectedParameterId);
  
  // Load groups for selected parameter
  const { data: optionGroupsData = [] } = useTaskParameterOptionGroups(selectedParameter?.parameter_id || '');

  // Calculate statistics
  const calculateStats = (parameters: TaskParameter[]) => {
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
      (parameter.name || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  // Auto-select first parameter when parameters load
  useEffect(() => {
    if (filteredAndSortedParameters.length > 0 && selectedParameterId === '') {
      setSelectedParameterId(filteredAndSortedParameters[0].id);
    }
  }, [filteredAndSortedParameters.length, selectedParameterId]);


  
  // Get filtered parameter values (options) for the selected parameter
  const filteredParameterValues = selectedParameter?.options || [];

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('name_asc');
  };

  // Legacy delete handlers removed - now using ModalFactory with direct mutations

  // Helper functions for parameter type styling
  const getParameterTypeVariant = (type: string) => {
    switch (type) {
      case 'text': return 'default';
      case 'number': return 'secondary';
      case 'select': return 'outline';
      case 'boolean': return 'destructive';
      default: return 'default';
    }
  };

  const getParameterTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Texto';
      case 'number': return 'Número';
      case 'select': return 'Selección';
      case 'boolean': return 'Booleano';
      default: return type;
    }
  };

  // Features for ActionBar expandable info
  const features = [
    {
      icon: <Settings className="w-4 h-4" />,
      title: "Gestión Avanzada de Parámetros",
      description: "Sistema completo de administración de parámetros reutilizables para tareas de construcción con soporte para diferentes tipos de datos."
    },
    {
      icon: <Building2 className="w-4 h-4" />,
      title: "Configuración de Opciones",
      description: "Permite crear y gestionar opciones personalizadas para parámetros de selección, organizadas en grupos para facilitar su uso."
    },
    {
      icon: <Eye className="w-4 h-4" />,
      title: "Vista Unificada de Parámetros",
      description: "Visualización centralizada de todos los parámetros con estadísticas en tiempo real y herramientas de búsqueda avanzada."
    },
    {
      icon: <Plus className="w-4 h-4" />,
      title: "Sistema de Templates Dinámicos",
      description: "Integración completa con plantillas de tareas para generar descripciones automáticas basadas en los parámetros configurados."
    }
  ];

  // Custom filters dropdown for ActionBar
  const renderCustomFilters = () => (
    <Select value={sortBy} onValueChange={setSortBy}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Ordenar por" />
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
        key: 'name',
        label: 'Slug',
        render: (value: TaskParameterOption) => (
          <div className="text-sm text-muted-foreground">{value.name}</div>
        )
      },
      {
        key: 'groups',
        label: 'Grupos',
        render: (value: TaskParameterOption) => (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground">Por implementar</span>
          </div>
        ),
        sortable: false
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
                  parameterId: parameter.parameter_id,
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

  return (
    <Layout wide={true}>
      <ActionBarDesktop
        title="Parámetros de Tareas"
        icon={<Settings className="w-5 h-5" />}
        features={features}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        customFilters={renderCustomFilters()}
        primaryActionLabel="Nuevo Parámetro"
        onPrimaryActionClick={() => openModal('task-parameter', {})}
      />
      
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
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Parámetros</p>
                      <p className="text-2xl font-semibold">{stats.totalParameters}</p>
                    </div>
                    <Settings className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Parámetros de Selección</p>
                      <p className="text-2xl font-semibold">{stats.selectParameters}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Opciones</p>
                      <p className="text-2xl font-semibold">{stats.totalOptions}</p>
                    </div>
                    <Eye className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Obligatorios</p>
                      <p className="text-2xl font-semibold">0</p>
                    </div>
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Single Parameter Card with Selector */}
            <Card className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between w-full p-4 border-b">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  
                  {/* Parameter Selector */}
                  <div className="flex-1">
                    <Select value={selectedParameterId} onValueChange={setSelectedParameterId}>
                      <SelectTrigger className="w-full max-w-sm">
                        <SelectValue placeholder="Selecciona un parámetro" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredAndSortedParameters.map((parameter: TaskParameter) => (
                          <SelectItem key={parameter.id} value={parameter.id}>
                            <div>
                              <div className="font-medium text-sm">{parameter.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {parameter.name} • {getParameterTypeLabel(parameter.type)} • {parameter.options?.length || 0} opciones
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      openModal('task-parameter', { parameter: selectedParameter });
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (selectedParameter) {
                        openModal('delete-confirmation', {
                          title: 'Eliminar Parámetro',
                          description: 'Esta acción no se puede deshacer. Se eliminará el parámetro y todas sus opciones asociadas.',
                          itemName: selectedParameter.label,
                          onConfirm: () => {
                            deleteParameterMutation.mutate(selectedParameter.id);
                          }
                        });
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>

                  {selectedParameter?.type === 'select' && (
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        openModal('task-parameter-option', {
                          parameterId: selectedParameter.parameter_id,
                          parameterLabel: selectedParameter.label,
                          option: null
                        });
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      AGREGAR OPCIÓN
                    </Button>
                  )}
                </div>
              </div>

              {/* Parameter Values Table */}
              <div className="p-4">
                {selectedParameter ? (
                  <ParameterValuesTable parameterId={selectedParameter.id} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Selecciona un parámetro para ver sus opciones
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* All modals now managed by ModalFactory */}
    </Layout>
  );
}