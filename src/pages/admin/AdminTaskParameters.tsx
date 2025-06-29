import { useState } from 'react';
import { Search, Plus, ChevronRight, ChevronDown, Edit, Trash2, Settings, List, Hash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { Layout } from '@/components/layout/Layout';

import { useTaskParametersAdmin, useDeleteTaskParameter, useDeleteTaskParameterOption, TaskParameter, TaskParameterOption } from '@/hooks/use-task-parameters-admin';
import { NewTaskParameterModal } from '@/modals/tasks/NewTaskParameterModal';
import { NewTaskParameterOptionModal } from '@/modals/tasks/NewTaskParameterOptionModal';

export default function AdminTaskParameters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedParameters, setExpandedParameters] = useState<Set<string>>(new Set());
  
  // Modal states
  const [isParameterModalOpen, setIsParameterModalOpen] = useState(false);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<TaskParameter | null>(null);
  const [editingOption, setEditingOption] = useState<TaskParameterOption | null>(null);
  const [selectedParameterId, setSelectedParameterId] = useState<string>('');
  
  // Delete confirmation states
  const [deleteParameterId, setDeleteParameterId] = useState<string | null>(null);
  const [deleteOptionId, setDeleteOptionId] = useState<string | null>(null);

  const { data: parameters = [], isLoading } = useTaskParametersAdmin();
  
  // Debug logging
  console.log('AdminTaskParameters - parameters data:', parameters);
  console.log('AdminTaskParameters - isLoading:', isLoading);
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

  // Filter parameters based on search
  const filteredParameters = parameters.filter(parameter =>
    (parameter.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (parameter.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (parameter.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle parameter expansion
  const toggleParameter = (parameterId: string) => {
    const newExpanded = new Set(expandedParameters);
    if (newExpanded.has(parameterId)) {
      newExpanded.delete(parameterId);
    } else {
      newExpanded.add(parameterId);
    }
    setExpandedParameters(newExpanded);
  };

  // Handle parameter actions
  const handleEditParameter = (parameter: TaskParameter) => {
    setEditingParameter(parameter);
    setIsParameterModalOpen(true);
  };

  const handleDeleteParameter = async (parameterId: string) => {
    try {
      await deleteParameterMutation.mutateAsync(parameterId);
      setDeleteParameterId(null);
    } catch (error) {
      console.error('Error deleting parameter:', error);
    }
  };

  // Handle option actions
  const handleCreateOption = (parameterId: string) => {
    setSelectedParameterId(parameterId);
    setEditingOption(null);
    setIsOptionModalOpen(true);
  };

  const handleEditOption = (option: TaskParameterOption) => {
    setSelectedParameterId(option.parameter_id);
    setEditingOption(option);
    setIsOptionModalOpen(true);
  };

  const handleDeleteOption = async (optionId: string) => {
    try {
      await deleteOptionMutation.mutateAsync(optionId);
      setDeleteOptionId(null);
    } catch (error) {
      console.error('Error deleting option:', error);
    }
  };

  // Get template ID for new parameters (this would come from context or be selected)
  const defaultTemplateId = "default-template-id"; // This should be dynamic based on selected template
  
  // Helper functions for parameter/option management
  const getParameterById = (parameterId: string) => {
    return parameters.find(p => p.id === parameterId);
  };

  const getOptionsByParameter = (parameterId: string) => {
    const parameter = getParameterById(parameterId);
    return parameter?.options || [];
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

  const getParameterTypeVariant = (type: string) => {
    switch (type) {
      case 'text': return 'default';
      case 'number': return 'secondary';
      case 'select': return 'outline';
      case 'boolean': return 'destructive';
      default: return 'default';
    }
  };

  const headerProps = {
    title: "Parámetros de Tarea",
    showSearch: true,
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    actions: [
      <Button
        key="new-parameter"
        onClick={() => {
          setEditingParameter(null);
          setIsParameterModalOpen(true);
        }}
        size="sm"
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Nuevo Parámetro
      </Button>
    ]
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-semibold">Cargando parámetros...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
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
                  <p className="text-xs text-muted-foreground">Tipo Selección</p>
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
          {filteredParameters.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                {searchTerm ? 'No se encontraron parámetros que coincidan con la búsqueda' : 'No hay parámetros creados'}
              </div>
            </Card>
          ) : (
            filteredParameters.map(parameter => {
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
                      <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{parameter.label}</span>
                                <Badge variant={getParameterTypeVariant(parameter.type)}>
                                  {getParameterTypeLabel(parameter.type)}
                                </Badge>
                                {parameter.unit_id && (
                                  <Badge variant="outline" className="text-xs">
                                    {parameter.unit_id}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {parameter.name} • {optionsCount} opciones
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditParameter(parameter);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteParameterId(parameter.id);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium">Opciones del parámetro</h4>
                          <Button
                            size="sm"
                            onClick={() => handleCreateOption(parameter.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar Opción
                          </Button>
                        </div>

                        {parameter.options && parameter.options.length > 0 ? (
                          <div className="grid gap-2">
                            {parameter.options.map(option => (
                                <div
                                  key={option.id}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div>
                                      <span className="font-medium">{option.label}</span>
                                      <p className="text-xs text-muted-foreground">{option.value}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditOption(option)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setDeleteOptionId(option.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No hay opciones para este parámetro
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })
          )}
        </div>

        {/* Parameter Modal */}
        <NewTaskParameterModal
          open={isParameterModalOpen}
          onClose={() => {
            setIsParameterModalOpen(false);
            setEditingParameter(null);
          }}
          parameter={editingParameter || undefined}
          templateId={defaultTemplateId}

        />

        {/* Option Modal */}
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
      </div>
    </Layout>
  );
}