import { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, Eye, Building2, List, TreePine } from 'lucide-react';

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

import { useTaskParametersAdmin, useDeleteTaskParameter, useDeleteTaskParameterOption, TaskParameter, TaskParameterOption, TaskParameterWithOptions } from '@/hooks/use-task-parameters-admin';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { ParameterNodeEditor } from '@/components/ui-custom/ParameterNodeEditor';
import { useTopLevelCategories, useUnits } from '@/hooks/use-task-categories';
// Removed NewTaskParameterOptionModal - now using ModalFactory with 'task-parameter-option' type


export default function AdminTaskParameters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [selectedParameterId, setSelectedParameterId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('lista');
  
  // Global modal store
  const { openModal } = useGlobalModalStore();
  
  // Legacy delete confirmation states removed - now using ModalFactory
  
  // Removed old option modal states - now using ModalFactory

  const { data: parameters = [], isLoading, error } = useTaskParametersAdmin();
  const deleteParameterMutation = useDeleteTaskParameter();
  const deleteOptionMutation = useDeleteTaskParameterOption();
  
  // Get selected parameter
  const selectedParameter = parameters.find(param => param.id === selectedParameterId);
  
  // Groups functionality removed - using simplified system

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

  // Parameter selector handlers
  const handleParameterChange = (parameterId: string) => {
    setSelectedParameterId(parameterId);
  };

  const handleEditParameter = () => {
    if (selectedParameter) {
      openModal('task-parameter', {
        parameter: selectedParameter,
        isEditing: true
      });
    }
  };

  const handleDeleteParameter = () => {
    if (selectedParameter) {
      openModal('delete-confirmation', {
        title: 'Eliminar Parámetro',
        description: '¿Estás seguro de que deseas eliminar este parámetro?',
        itemName: selectedParameter.label,
        onConfirm: () => {
          deleteParameterMutation.mutate(selectedParameter.id);
        }
      });
    }
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

  // Header tabs configuration
  const headerTabs = [
    {
      id: "lista",
      label: "Lista",
      isActive: activeTab === "lista"
    },
    {
      id: "arbol", 
      label: "Árbol",
      isActive: activeTab === "arbol"
    }
  ]

  const headerProps = {
    title: 'Parámetros de Tareas',
    tabs: headerTabs,
    onTabChange: setActiveTab,
    showSearch: activeTab === "lista",
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    customFilters: activeTab === "lista" ? renderCustomFilters() : undefined,
    actionButton: {
      label: "Nuevo Parámetro",
      icon: Plus,
      onClick: () => openModal('task-parameter', {
        onParameterCreated: (parameterId: string) => {
          setSelectedParameterId(parameterId);
        }
      }),
      additionalButton: activeTab === "lista" && filteredAndSortedParameters.length > 0 && selectedParameter ? {
        label: "Agregar Opción",
        icon: Plus,
        onClick: () => {
          if (selectedParameter) {
            openModal('task-parameter-option', {
              parameterId: selectedParameter.id
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
        {activeTab === "lista" && (
          <>
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
                {/* Parameters Table with Selection */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <List className="h-5 w-5" />
                      Lista de Parámetros
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table
                      data={filteredAndSortedParameters}
                      columns={[
                        {
                          key: 'selection',
                          label: '',
                          width: '5%',
                          render: (parameter: TaskParameterWithOptions) => (
                            <input
                              type="radio"
                              name="selectedParameter"
                              checked={selectedParameterId === parameter.id}
                              onChange={() => setSelectedParameterId(parameter.id)}
                              className="w-4 h-4 text-primary"
                            />
                          ),
                          sortable: false
                        },
                        {
                          key: 'label',
                          label: 'Nombre',
                          render: (parameter: TaskParameterWithOptions) => (
                            <div className="flex flex-col">
                              <div className="font-medium text-sm">{parameter.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {parameter.slug}
                              </div>
                            </div>
                          ),
                          sortable: true,
                          sortType: 'string' as const
                        },
                        {
                          key: 'type',
                          label: 'Tipo',
                          width: '15%',
                          render: (parameter: TaskParameterWithOptions) => (
                            <Badge variant="outline" className="text-xs">
                              {parameter.type}
                            </Badge>
                          ),
                          sortable: true,
                          sortType: 'string' as const
                        },
                        {
                          key: 'options_count',
                          label: 'Opciones',
                          width: '12%',
                          render: (parameter: TaskParameterWithOptions) => (
                            <div className="text-sm text-center">
                              <Badge variant="secondary" className="text-xs">
                                {parameter.options?.length || 0}
                              </Badge>
                            </div>
                          ),
                          sortable: true,
                          sortType: 'number' as const
                        },
                        {
                          key: 'is_required',
                          label: 'Requerido',
                          width: '12%',
                          render: (parameter: TaskParameterWithOptions) => (
                            <div className="text-center">
                              {parameter.is_required ? (
                                <Badge variant="destructive" className="text-xs">
                                  Sí
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  No
                                </Badge>
                              )}
                            </div>
                          ),
                          sortable: true,
                          sortType: 'boolean' as const
                        },
                        {
                          key: 'actions',
                          label: 'Acciones',
                          width: '15%',
                          render: (parameter: TaskParameterWithOptions) => (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  openModal('task-parameter', {
                                    parameter: parameter,
                                    onParameterCreated: (parameterId: string) => {
                                      setSelectedParameterId(parameterId);
                                    }
                                  });
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  openModal('delete-confirmation', {
                                    title: 'Eliminar Parámetro',
                                    description: '¿Estás seguro de que deseas eliminar este parámetro? Se eliminarán también todas sus opciones.',
                                    itemName: parameter.label,
                                    onConfirm: () => {
                                      deleteParameterMutation.mutate(parameter.id);
                                      if (selectedParameterId === parameter.id) {
                                        setSelectedParameterId('');
                                      }
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
                      ]}
                      searchable={false}
                      selectable={false}
                    />
                  </CardContent>
                </Card>

                {/* Parameter Options Section */}
                {selectedParameter ? (
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Opciones del Parámetro: {selectedParameter.label}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        Gestiona las opciones disponibles para este parámetro
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ParameterValuesTable parameterId={selectedParameter.id} />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <div className="text-lg font-medium mb-2">
                      Selecciona un parámetro
                    </div>
                    <div>
                      Marca un parámetro de la tabla de arriba para ver y gestionar sus opciones
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "arbol" && (
          <ParameterNodeEditor />
        )}
      </div>

      {/* All modals now managed by ModalFactory */}
    </Layout>
  );
}