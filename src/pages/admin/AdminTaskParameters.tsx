import { useState } from 'react';
import { Search, Plus, ChevronRight, ChevronDown, Edit, Trash2, Settings, List, Hash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { Layout } from '@/components/layout/desktop/Layout';

import { useTaskParametersAdmin, useDeleteTaskParameter, useDeleteTaskParameterOption, TaskParameter, TaskParameterOption } from '@/hooks/use-task-parameters-admin';
import { NewTaskParameterModal } from '@/modals/tasks/NewTaskParameterModal';
import { NewTaskParameterOptionModal } from '@/modals/tasks/NewTaskParameterOptionModal';
import { TaskParameterEditorModal } from '@/modals/admin/tasks/TaskParameterEditorModal';

export default function AdminTaskParameters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [expandedParameters, setExpandedParameters] = useState<Set<string>>(new Set());
  
  // Modal states
  const [isParameterModalOpen, setIsParameterModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<TaskParameter | null>(null);
  const [editingOption, setEditingOption] = useState<TaskParameterOption | null>(null);
  const [selectedParameterId, setSelectedParameterId] = useState<string>('');
  
  // Delete confirmation states
  const [deleteParameterId, setDeleteParameterId] = useState<string | null>(null);
  const [deleteOptionId, setDeleteOptionId] = useState<string | null>(null);

  const { data: parameters = [], isLoading } = useTaskParametersAdmin();
  const deleteParameterMutation = useDeleteTaskParameter();
  const deleteOptionMutation = useDeleteTaskParameterOption();

  // Parameters are now created independently without template association

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

  // Toggle parameter expansion (single accordion behavior)
  const toggleParameter = (parameterId: string) => {
    const newExpanded = new Set<string>();
    if (!expandedParameters.has(parameterId)) {
      newExpanded.add(parameterId);
    }
    setExpandedParameters(newExpanded);
  };

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

  // Get parameter type label for display
  const getParameterTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Texto';
      case 'number': return 'Número';
      case 'select': return 'Selección';
      case 'boolean': return 'Booleano';
      default: return type;
    }
  };

  const getParameterTypeVariant = (type: string) => {
    switch (type) {
      case 'text': return 'default';
      case 'number': return 'secondary';
      case 'select': return 'outline';
      case 'boolean': return 'destructive';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Layout headerProps={{
        title: "Parámetros de Tarea",
        showSearch: true,
        searchValue: searchTerm,
        onSearchChange: setSearchTerm,
        actions: [
          <Button
            key="new-parameter"
            onClick={() => {
              setEditingParameter(null);
              setIsEditorModalOpen(true);
            }}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Parámetro
          </Button>
        ]
      }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-semibold">Cargando parámetros...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout wide={true} headerProps={{
        title: "Parámetros de Tarea",
        showSearch: true,
        searchValue: searchTerm,
        onSearchChange: setSearchTerm,
        customFilters: (
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Ordenar por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Nombre (Z-A)</SelectItem>
                  <SelectItem value="type_asc">Tipo (A-Z)</SelectItem>
                  <SelectItem value="type_desc">Tipo (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ),
        onClearFilters: clearFilters,
        actions: [
          <Button
            key="new-parameter"
            onClick={() => {
              setEditingParameter(null);
              setIsEditorModalOpen(true);
            }}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Parámetro
          </Button>
        ]
      }}>
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <List className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Parámetros</p>
                    <p className="text-lg font-semibold">{stats.totalParameters}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo Select</p>
                    <p className="text-lg font-semibold">{stats.selectParameters}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Opciones</p>
                    <p className="text-lg font-semibold">{stats.totalOptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Obligatorios</p>
                    <p className="text-lg font-semibold">{stats.requiredParameters}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parameters Accordion */}
          <div className="space-y-2">
            {filteredAndSortedParameters.length === 0 ? (
              <Card className="p-8">
                <div className="text-center text-muted-foreground">
                  {searchTerm ? 'No se encontraron parámetros que coincidan con la búsqueda' : 'No hay parámetros creados'}
                </div>
              </Card>
            ) : (
              filteredAndSortedParameters.map(parameter => {
                const isExpanded = expandedParameters.has(parameter.id);
                const optionsCount = parameter.options?.length || 0;

                return (
                  <Collapsible
                    key={parameter.id}
                    open={isExpanded}
                    onOpenChange={() => toggleParameter(parameter.id)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-medium text-sm">{parameter.label}</h3>
                                  <Badge variant={getParameterTypeVariant(parameter.type)} className="text-xs">
                                    {getParameterTypeLabel(parameter.type)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {parameter.name} • {optionsCount} opciones
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {parameter.type === 'select' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedParameterId(parameter.parameter_id);
                                    setEditingOption(null);
                                    setIsOptionModalOpen(true);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingParameter(parameter);
                                  setIsEditorModalOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteParameterId(parameter.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-3 pb-3 border-t border-muted">
                          <div className="pt-3">
                            <div className="space-y-2">
                              {parameter.options && parameter.options.length > 0 ? (
                                parameter.options
                                  .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
                                  .map((option) => (
                                  <Card key={option.id} className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <span className="text-xs font-medium">{option.label}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                          ({option.value})
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedParameterId(parameter.parameter_id);
                                            setEditingOption(option);
                                            setIsOptionModalOpen(true);
                                          }}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setDeleteOptionId(option.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))
                              ) : (
                                <div className="text-center py-2 text-xs text-muted-foreground">
                                  No hay opciones definidas
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            )}
          </div>
        </div>
      </Layout>

      {/* Parameter Editor Modal */}
      {isEditorModalOpen && (
        <TaskParameterEditorModal
          open={isEditorModalOpen}
          onClose={() => {
            setIsEditorModalOpen(false);
            setEditingParameter(null);
          }}
          parameter={editingParameter || undefined}
        />
      )}

      {/* Option Modal */}
      {isOptionModalOpen && (
        <NewTaskParameterOptionModal
          open={isOptionModalOpen}
          onClose={() => {
            setIsOptionModalOpen(false);
            setEditingOption(null);
            setSelectedParameterId('');
          }}
          option={editingOption || undefined}
          parameterId={selectedParameterId}
          parameterLabel={
            parameters.find(p => p.id === selectedParameterId)?.label || ''
          }
        />
      )}

      {/* Delete Parameter Confirmation */}
      <AlertDialog open={!!deleteParameterId} onOpenChange={() => setDeleteParameterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar parámetro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el parámetro y todas sus opciones permanentemente.
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
      <AlertDialog open={!!deleteOptionId} onOpenChange={() => setDeleteOptionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar opción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la opción permanentemente.
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
    </>
  );
}