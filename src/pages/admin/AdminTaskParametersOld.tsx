import { useState, useEffect } from 'react';
import { Search, Plus, ChevronRight, ChevronDown, Edit, Trash2, Settings, List, Hash, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { Layout } from '@/components/layout/desktop/Layout';
import { Table } from '@/components/ui-custom/Table';
import { EmptyState } from '@/components/ui-custom/EmptyState';

import { useTaskParametersAdmin, useDeleteTaskParameter, useDeleteTaskParameterOption, TaskParameter, TaskParameterOption } from '@/hooks/use-task-parameters-admin';
import { NewTaskParameterModal } from '@/modals/admin/tasks/NewTaskParameterModal';
import { NewTaskParameterOptionModal } from '@/modals/admin/tasks/NewTaskParameterOptionModal';
import { TaskParameterEditorModal } from '@/modals/admin/tasks/TaskParameterEditorModal';

export default function AdminTaskParameters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [expandedParameters, setExpandedParameters] = useState<Set<string>>(new Set());
  const [selectedParameterId, setSelectedParameterId] = useState<string>('');
  
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
          >
            Nuevo Parámetro
          </Button>
        ]
      }}>
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
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
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
          >
            Nuevo Parámetro
          </Button>
        ]
      }}>
          {/* Statistics Cards */}
                  <div>
                  </div>
                </div>
              </CardContent>
            </Card>

                  <div>
                  </div>
                </div>
              </CardContent>
            </Card>

                  <div>
                  </div>
                </div>
              </CardContent>
            </Card>

                  <div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parameters Accordion */}
            {filteredAndSortedParameters.length === 0 ? (
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
                              {isExpanded ? (
                              ) : (
                              )}
                                    {getParameterTypeLabel(parameter.type)}
                                  </Badge>
                                </div>
                                  {parameter.name} • {optionsCount} opciones
                                </p>
                              </div>
                            </div>
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
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteParameterId(parameter.id);
                                }}
                              >
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                              {parameter.options && parameter.options.length > 0 ? (
                                parameter.options
                                  .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
                                  .map((option) => (
                                        {option.name && (
                                            ({option.name})
                                          </span>
                                        )}
                                      </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedParameterId(parameter.parameter_id);
                                            setEditingOption(option);
                                            setIsOptionModalOpen(true);
                                          }}
                                        >
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setDeleteOptionId(option.id)}
                                        >
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))
                              ) : (
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
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}