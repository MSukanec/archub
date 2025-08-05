import { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, Eye, Building2, List, TreePine } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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

  const headerProps = {
    title: 'Parámetros de Tareas',
    showBreadcrumb: true,
    breadcrumb: [
      { label: 'Administración', href: '/admin' },
      { label: 'Parámetros de Tareas', href: '/admin/task-parameters' }
    ],
    showSearch: true,
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    customFilters: renderCustomFilters(),
    actions: [
      <Button 
        key="nuevo-parametro"
        onClick={() => openModal('task-parameter', {
          onParameterCreated: (parameterId: string) => {
            setSelectedParameterId(parameterId);
          }
        })}
        size="sm"
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Nuevo Parámetro
      </Button>
    ]
  };

  return (
    <Layout wide headerProps={headerProps}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Tabs List */}
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="arbol">Árbol</TabsTrigger>
          </TabsList>
          
          {activeTab === "lista" && filteredAndSortedParameters.length > 0 && selectedParameter && (
            <Button 
              onClick={() => {
                if (selectedParameter) {
                  openModal('task-parameter-option', {
                    parameterId: selectedParameter.id
                  });
                }
              }}
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Opción
            </Button>
          )}
        </div>
      
      {/* Tab Content */}
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
                {/* Parameter Values Table */}
                {selectedParameter ? (
                  <ParameterValuesTable parameterId={selectedParameter.id} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Selecciona un parámetro para ver sus opciones
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
      </Tabs>

      {/* All modals now managed by ModalFactory */}
    </Layout>
  );
}