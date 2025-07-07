import { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, Eye, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { Layout } from '@/components/layout/desktop/Layout';
import { CustomTable } from '@/components/ui-custom/misc/CustomTable';
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState';

import { useTaskParametersAdmin, useDeleteTaskParameter, useDeleteTaskParameterOption, TaskParameter, TaskParameterOption } from '@/hooks/use-task-parameters-admin';
import { NewTaskParameterModal } from '@/modals/tasks/NewTaskParameterModal';
import { NewTaskParameterOptionModal } from '@/modals/tasks/NewTaskParameterOptionModal';


export default function AdminTaskParameters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [selectedParameterId, setSelectedParameterId] = useState<string>('');
  
  // Modal states
  const [isParameterModalOpen, setIsParameterModalOpen] = useState(false);

  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<TaskParameter | null>(null);
  const [editingOption, setEditingOption] = useState<TaskParameterOption | null>(null);
  
  // Delete confirmation states
  const [deleteParameterId, setDeleteParameterId] = useState<string | null>(null);
  const [deleteOptionId, setDeleteOptionId] = useState<string | null>(null);

  const { data: parameters = [], isLoading, error } = useTaskParametersAdmin();
  const deleteParameterMutation = useDeleteTaskParameter();
  const deleteOptionMutation = useDeleteTaskParameterOption();

  // Calculate statistics
  const calculateStats = (parameters: TaskParameter[]) => {
    const totalParameters = parameters.length;
    const selectParameters = parameters.filter(p => p.type === 'select').length;
    const totalOptions = parameters.reduce((sum, param) => sum + (param.options?.length || 0), 0);
    const requiredParameters = parameters.filter(p => p.is_required).length;

    return { totalParameters, selectParameters, totalOptions, requiredParameters };
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

  // Get selected parameter
  const selectedParameter = filteredAndSortedParameters.find(param => param.id === selectedParameterId);
  
  // Get filtered parameter values (options) for the selected parameter
  const filteredParameterValues = selectedParameter?.options || [];

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('name_asc');
  };

  // Handle parameter deletion
  const handleDeleteParameter = async (parameterId: string) => {
    try {
      await deleteParameterMutation.mutateAsync(parameterId);
      setDeleteParameterId(null);
    } catch (error) {
      console.error('Error deleting parameter:', error);
    }
  };

  // Handle option deletion
  const handleDeleteOption = async (optionId: string) => {
    try {
      await deleteOptionMutation.mutateAsync(optionId);
      setDeleteOptionId(null);
    } catch (error) {
      console.error('Error deleting option:', error);
    }
  };

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

  // Custom filters for the header
  const customFilters = (
    <div className="flex gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Nombre A-Z</SelectItem>
            <SelectItem value="name_desc">Nombre Z-A</SelectItem>
            <SelectItem value="type_asc">Tipo A-Z</SelectItem>
            <SelectItem value="type_desc">Tipo Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Header actions
  const actions = [
    <Button 
      key="new-parameter"
      className="h-8 px-3 text-sm"
      onClick={() => setIsParameterModalOpen(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Nuevo Parámetro
    </Button>
  ];

  const headerProps = {
    icon: Settings,
    title: "Parámetros de Tareas",
    showSearch: true,
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    showFilters: true,
    customFilters,
    onClearFilters: clearFilters,
    actions
  };

  if (isLoading) {
    return (
      <Layout wide={true} headerProps={headerProps}>
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
        <CustomEmptyState
          icon={<Settings className="w-8 h-8 text-muted-foreground" />}
          title="No hay opciones en este parámetro"
          description="Comienza agregando la primera opción para este parámetro"
          action={
            parameter.type === 'select' && (
              <Button 
                size="sm" 
                onClick={() => {
                  setSelectedParameterId(parameter.parameter_id);
                  setEditingOption(null);
                  setIsOptionModalOpen(true);
                }}
                className="h-8 px-3 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Agregar Opción
              </Button>
            )
          }
        />
      );
    }

    // CustomTable columns for parameter values
    const columns = [
      {
        key: 'label',
        label: 'Etiqueta',
        render: (value: TaskParameterOption) => (
          <div className="font-medium text-sm">{value.label}</div>
        )
      },
      {
        key: 'name',
        label: 'Nombre',
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
                setEditingOption(value);
                setSelectedParameterId(parameter.parameter_id);
                setIsOptionModalOpen(true);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => setDeleteOptionId(value.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ),
        sortable: false
      }
    ];

    return (
      <CustomTable
        data={parameterValues}
        columns={columns}
        searchPlaceholder="Buscar opciones..."
      />
    );
  }

  return (
    <Layout wide={true} headerProps={headerProps}>
      <div className="space-y-6">
        {filteredAndSortedParameters.length === 0 ? (
          <CustomEmptyState
            icon={<Settings className="w-12 h-12 text-muted-foreground" />}
            title={searchTerm ? "No se encontraron parámetros" : "No hay parámetros creados"}
            description={searchTerm 
              ? 'Prueba ajustando los filtros de búsqueda' 
              : 'Comienza creando tu primer parámetro para gestionar las opciones de tareas'
            }
            action={
              !searchTerm && (
                <Button onClick={() => setIsParameterModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Parámetro
                </Button>
              )
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
                      <p className="text-2xl font-semibold">{stats.requiredParameters}</p>
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
                  {selectedParameter?.type === 'select' && (
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setSelectedParameterId(selectedParameter.parameter_id);
                        setEditingOption(null);
                        setIsOptionModalOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar Opción
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setEditingParameter(selectedParameter);
                      setIsParameterModalOpen(true);
                    }}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => setDeleteParameterId(selectedParameter?.id || '')}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Borrar
                  </Button>
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

      {/* Modals */}
      <NewTaskParameterModal
        open={isParameterModalOpen}
        onClose={() => {
          setIsParameterModalOpen(false);
          setEditingParameter(null);
        }}
        parameter={editingParameter}
        onParameterCreated={(parameterId) => {
          setSelectedParameterId(parameterId);
        }}
      />

      <NewTaskParameterOptionModal
        open={isOptionModalOpen}
        onClose={() => {
          setIsOptionModalOpen(false);
          setEditingOption(null);
          // No limpiar selectedParameterId para mantener el parámetro seleccionado
        }}
        parameterId={selectedParameterId}
        parameterLabel={selectedParameter?.label || ''}
        option={editingOption}
      />

      {/* Delete Parameter Confirmation */}
      <AlertDialog open={deleteParameterId !== null} onOpenChange={() => setDeleteParameterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar parámetro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el parámetro y todas sus opciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteParameterId && handleDeleteParameter(deleteParameterId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Option Confirmation */}
      <AlertDialog open={deleteOptionId !== null} onOpenChange={() => setDeleteOptionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar opción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la opción del parámetro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOptionId && handleDeleteOption(deleteOptionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}