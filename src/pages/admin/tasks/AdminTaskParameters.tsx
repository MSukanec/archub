import { useState } from 'react';
import { Settings, Edit, Trash2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { ActionBar } from '@/components/layout/desktop/ActionBar';

import { useTaskParametersAdmin, useDeleteTaskParameter, useDeleteTaskParameterOption, TaskParameterOption, TaskParameterWithOptions } from '@/hooks/use-task-parameters-admin';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useTopLevelCategories, useUnits } from '@/hooks/use-task-categories';

const AdminTaskParameters = () => {
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

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Cargando parámetros...
      </div>
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
          Parámetro no encontrado
        </div>
      );
    }

    if (parameterValues.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => {
                openModal('task-parameter-option', { parameterId });
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Agregar Opción
            </Button>
          </div>
          <EmptyState
            icon={<Settings className="w-8 h-8 text-muted-foreground" />}
            title="No hay opciones en este parámetro"
            description="Comienza agregando la primera opción para este parámetro"
          />
        </div>
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
      }
    ];

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => {
              openModal('task-parameter-option', { parameterId });
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Agregar Opción
          </Button>
        </div>
        <Table
          data={parameterValues}
          columns={columns}
          rowActions={(value: TaskParameterOption) => [
            {
              icon: Edit,
              label: 'Editar',
              onClick: () => {
                openModal('task-parameter-option', {
                  parameterId: parameter.id,
                  parameterLabel: parameter.label,
                  option: value
                });
              }
            },
            {
              icon: Trash2,
              label: 'Eliminar',
              onClick: () => {
                openModal('delete-confirmation', {
                  title: 'Eliminar Opción',
                  description: '¿Estás seguro de que deseas eliminar esta opción?',
                  itemName: value.label,
                  onConfirm: () => {
                    deleteOptionMutation.mutate(value.id);
                  }
                });
              },
              variant: 'destructive' as const
            }
          ]}
        />
      </div>
    );
  }

  // Preparar opciones para el ComboBox
  const parameterOptions = filteredAndSortedParameters.map(parameter => ({
    value: parameter.id,
    label: `${parameter.label} (${parameter.type})`
  }));

  const handleEditParameter = () => {
    if (selectedParameter) {
      openModal('task-parameter', { parameter: selectedParameter });
    }
  };

  const handleDeleteParameter = () => {
    if (selectedParameter) {
      openModal('delete-confirmation', {
        title: 'Eliminar Parámetro',
        description: '¿Estás seguro de que deseas eliminar este parámetro? Esta acción también eliminará todas sus opciones.',
        itemName: selectedParameter.label,
        onConfirm: () => {
          deleteParameterMutation.mutate(selectedParameter.id);
          setSelectedParameterId('');
        }
      });
    }
  };

  return (
    <div className="space-y-0">
      {filteredAndSortedParameters.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={<Settings className="w-12 h-12 text-muted-foreground" />}
            title={searchTerm ? "No se encontraron parámetros" : "No hay parámetros creados"}
            description={searchTerm 
              ? 'Prueba ajustando los filtros de búsqueda' 
              : 'Comienza creando tu primer parámetro para gestionar las opciones de tareas'
            }
          />
        </div>
      ) : (
        <>
          <ActionBar
            selectedValue={selectedParameterId}
            onValueChange={setSelectedParameterId}
            onEdit={handleEditParameter}
            onDelete={handleDeleteParameter}
            placeholder="Selecciona un parámetro para ver sus opciones"
            options={parameterOptions}
          />

          <div className="p-6">
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
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTaskParameters;