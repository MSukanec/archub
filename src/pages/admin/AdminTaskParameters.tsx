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
      title: "Gestión Avanzada de Parámetros",
      description: "Sistema completo de administración de parámetros reutilizables para tareas de construcción con soporte para diferentes tipos de datos."
    },
    {
      title: "Configuración de Opciones",
      description: "Permite crear y gestionar opciones personalizadas para parámetros de selección, organizadas en grupos para facilitar su uso."
    },
    {
      title: "Vista Unificada de Parámetros",
      description: "Visualización centralizada de todos los parámetros con estadísticas en tiempo real y herramientas de búsqueda avanzada."
    },
    {
      title: "Sistema de Templates Dinámicos",
      description: "Integración completa con plantillas de tareas para generar descripciones automáticas basadas en los parámetros configurados."
    }
  ];

  // Custom filters dropdown for ActionBar
  const renderCustomFilters = () => (
    <Select value={sortBy} onValueChange={setSortBy}>
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
          Selecciona un parámetro para ver sus opciones
        </div>
      );
    }

    if (parameterValues.length === 0) {
      return (
        <EmptyState
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
        )
      },
      {
        key: 'description',
        label: 'Descripción',
        render: (value: TaskParameterOption) => (
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
                {unit ? (
                    {unit.abbreviation || unit.name}
                  </Badge>
                ) : (
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
                {category ? (
                    {category.code} - {category.name}
                  </Badge>
                ) : (
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
        )
      },
      {
        key: 'actions',
        label: 'Acciones',
        render: (value: TaskParameterOption) => (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                openModal('task-parameter-option', {
                  parameterId: parameter.id,
                  parameterLabel: parameter.label,
                  option: value
                });
              }}
            >
            </Button>
            <Button
              size="sm"
              variant="ghost"
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
        {activeTab === "lista" && (
          <>
            {filteredAndSortedParameters.length === 0 ? (
              <EmptyState
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
                      Seleccionar Parámetro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                                Parámetro seleccionado:
                              </div>
                                {selectedParameter.label}
                              </div>
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
                      Selecciona un parámetro
                    </div>
                    <div>
                      Utiliza el selector de arriba para elegir un parámetro y ver sus opciones
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