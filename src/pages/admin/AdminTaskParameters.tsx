import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Settings, List, Hash, Database } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { Layout } from '@/components/layout/desktop/Layout';
import { CustomTable } from '@/components/ui-custom/misc/CustomTable';

import { useTaskParametersAdmin, useDeleteTaskParameter, useDeleteTaskParameterOption, TaskParameter, TaskParameterOption } from '@/hooks/use-task-parameters-admin';
import { NewTaskParameterModal } from '@/modals/tasks/NewTaskParameterModal';
import { NewTaskParameterOptionModal } from '@/modals/tasks/NewTaskParameterOptionModal';
import { TaskParameterEditorModal } from '@/modals/admin/tasks/TaskParameterEditorModal';

export default function AdminTaskParameters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParameterId, setSelectedParameterId] = useState<string>('');
  
  // Modal states
  const [isParameterModalOpen, setIsParameterModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<TaskParameter | null>(null);
  const [editingOption, setEditingOption] = useState<TaskParameterOption | null>(null);
  
  // Delete confirmation states
  const [deleteParameterId, setDeleteParameterId] = useState<string | null>(null);
  const [deleteOptionId, setDeleteOptionId] = useState<string | null>(null);

  const { data: parameters = [], isLoading } = useTaskParametersAdmin();
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

  // Get selected parameter and its options
  const selectedParameter = parameters.find(p => p.id === selectedParameterId);
  const parameterOptions = selectedParameter?.options || [];
  
  // Filter options based on search
  const filteredOptions = parameterOptions.filter(option =>
    (option.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Auto-select first parameter if none selected
  React.useEffect(() => {
    if (!selectedParameterId && parameters.length > 0) {
      setSelectedParameterId(parameters[0].id);
    }
  }, [parameters, selectedParameterId]);

  // Handle parameter deletion
  const handleDeleteParameter = async (parameterId: string) => {
    try {
      await deleteParameterMutation.mutateAsync(parameterId);
      setDeleteParameterId(null);
      // If deleted parameter was selected, select first available
      if (parameterId === selectedParameterId && parameters.length > 1) {
        const remainingParams = parameters.filter(p => p.id !== parameterId);
        setSelectedParameterId(remainingParams[0]?.id || '');
      }
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

  // Table columns for parameter options
  const columns = [
    {
      key: 'label',
      label: 'Etiqueta',
      sortable: true,
      render: (option: TaskParameterOption) => (
        <div>
          <div className="font-medium">{option.label}</div>
          {option.name && option.name !== option.label && (
            <div className="text-xs text-muted-foreground">({option.name})</div>
          )}
        </div>
      )
    },
    {
      key: 'position',
      label: 'Posición',
      sortable: true,
      render: (option: TaskParameterOption) => (
        <Badge variant="outline">{option.position}</Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (option: TaskParameterOption) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingOption(option);
              setIsOptionModalOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteOptionId(option.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <Layout wide={true} headerProps={{
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
              <Label className="text-xs font-medium">Parámetro</Label>
              <Select value={selectedParameterId} onValueChange={setSelectedParameterId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar parámetro" />
                </SelectTrigger>
                <SelectContent>
                  {parameters.map((param) => (
                    <SelectItem key={param.id} value={param.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant={param.type === 'select' ? 'default' : 'outline'}>
                          {param.type}
                        </Badge>
                        {param.label}
                        {param.is_required && <span className="text-red-500">*</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ),
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
          </Button>,
          <Button
            key="edit-parameter"
            onClick={() => {
              setEditingParameter(selectedParameter || null);
              setIsEditorModalOpen(true);
            }}
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={!selectedParameter}
          >
            <Edit className="h-4 w-4" />
            Editar Parámetro
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

          {/* Selected Parameter Info Card */}
          {selectedParameter && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      {selectedParameter.label}
                      {selectedParameter.is_required && <span className="text-red-500">*</span>}
                    </CardTitle>
                    <CardDescription>
                      Tipo: <Badge variant="outline">{selectedParameter.type}</Badge>
                      {selectedParameter.unit && (
                        <>
                          {' • '}Unidad: {selectedParameter.unit}
                        </>
                      )}
                      {' • '}{parameterOptions.length} opciones disponibles
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingOption(null);
                        setIsOptionModalOpen(true);
                      }}
                      disabled={selectedParameter.type !== 'select'}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Opción
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteParameterId(selectedParameter.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Options Table */}
          {selectedParameter && (
            <CustomTable
              data={filteredOptions}
              columns={columns}
              emptyMessage={
                selectedParameter.type !== 'select' 
                  ? `Este parámetro de tipo "${selectedParameter.type}" no tiene opciones configurables.`
                  : "No hay opciones disponibles para este parámetro."
              }
              defaultSort={{ key: 'position', direction: 'asc' }}
            />
          )}

          {/* No Parameter Selected */}
          {!selectedParameter && parameters.length > 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Selecciona un parámetro</h3>
                <p className="text-muted-foreground">
                  Usa el selector de parámetros en el filtro para ver las opciones disponibles.
                </p>
              </CardContent>
            </Card>
          )}

          {/* No Parameters Available */}
          {parameters.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No hay parámetros</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primer parámetro de tarea para empezar.
                </p>
                <Button
                  onClick={() => {
                    setEditingParameter(null);
                    setIsEditorModalOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Crear Parámetro
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>

      {/* Modals */}
      <TaskParameterEditorModal
        open={isEditorModalOpen}
        onOpenChange={setIsEditorModalOpen}
        editingParameter={editingParameter}
      />

      <NewTaskParameterOptionModal
        open={isOptionModalOpen}
        onOpenChange={setIsOptionModalOpen}
        parameterId={selectedParameterId}
        editingOption={editingOption}
        onClose={() => {
          setIsOptionModalOpen(false);
          setEditingOption(null);
        }}
      />

      {/* Delete Parameter Confirmation */}
      <AlertDialog open={!!deleteParameterId} onOpenChange={() => setDeleteParameterId(null)}>
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
      <AlertDialog open={!!deleteOptionId} onOpenChange={() => setDeleteOptionId(null)}>
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
    </>
  );
}