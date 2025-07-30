import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Position,
  Handle,
  NodeProps,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Edit, Trash2, Settings, Plus } from 'lucide-react';
import { ComboBoxMultiSelect } from '@/components/ui-custom/ComboBoxMultiSelect';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { TaskParameterPosition, InsertTaskParameterPosition } from '@shared/schema';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ParameterNodeData {
  parameter: {
    id: string;
    label: string;
    slug: string;
  };
  options: Array<{
    id: string;
    label: string;
  }>;
  visibleOptions: string[];
  onVisibleOptionsChange: (optionIds: string[]) => void;
  onDuplicate: (parameterId: string) => void;
  onEdit: (parameterId: string) => void;
  onDelete: (nodeId: string) => void;
  onConfigureVisibility?: (parameterId: string) => void; // Nueva función para configurar visibilidad
  hasParentDependencies?: boolean; // Indica si el nodo tiene padres conectados
}

// Componente de nodo personalizado
function ParameterNode({ data, id }: NodeProps<ParameterNodeData>) {
  const { parameter, options, visibleOptions, onVisibleOptionsChange, onDuplicate, onEdit, onDelete, onConfigureVisibility, hasParentDependencies } = data;
  
  const visibleOptionsList = options.filter(option => visibleOptions.includes(option.id));
  const comboBoxOptions = options.map(option => ({
    value: option.id,
    label: option.label
  }));

  return (
    <div className="relative">
      <Card className="min-w-[250px] max-w-[300px] border-2 shadow-lg bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex-1">
              {parameter.label}
            </CardTitle>
            <div className="flex items-center gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(parameter.id);
                }}
                title="Duplicar parámetro"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(parameter.id);
                }}
                title="Editar parámetro"
              >
                <Edit className="h-3 w-3" />
              </Button>
              {hasParentDependencies && onConfigureVisibility && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfigureVisibility(parameter.id);
                  }}
                  title="Configurar visibilidad por opción"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
                title="Borrar parámetro"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <ComboBoxMultiSelect
            options={comboBoxOptions}
            value={visibleOptions}
            onChange={onVisibleOptionsChange}
            placeholder="Seleccionar opciones..."
            className="text-xs w-full"
            maxDisplay={2}
          />
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {visibleOptionsList.map((option, index) => (
            <div
              key={option.id}
              className="relative flex items-center py-1 px-2 rounded bg-muted/50 text-xs"
            >
              <span className="truncate pr-4">{option.label}</span>
              {/* Handle de salida al nivel del borde */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${id}-${option.id}`}
                style={{
                  right: -8, // Mismo nivel que el handle azul
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 16,
                  height: 16,
                  backgroundColor: '#10b981',
                  border: '2px solid #ffffff',
                  borderRadius: '50%',
                  zIndex: 20,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Handle de entrada principal */}
      <Handle
        type="target"
        position={Position.Left}
        id={`target-${id}`}
        style={{
          left: -8, // Posición original del handle azul
          top: '50%',
          width: 16,
          height: 16,
          backgroundColor: '#3b82f6',
          border: '2px solid #ffffff',
          borderRadius: '50%',
          zIndex: 10, // Z-index original
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      />
    </div>
  );
}

// Hook para obtener parámetros con opciones
const useParametersWithOptions = () => {
  return useQuery({
    queryKey: ['parameters-with-options'],
    queryFn: async () => {
      const { data: parameters, error: paramsError } = await supabase!
        .from('task_parameters')
        .select('id, slug, label, type')
        .eq('type', 'select')
        .order('label');

      if (paramsError) throw paramsError;

      const parametersWithOptions = await Promise.all(
        parameters.map(async (parameter) => {
          const { data: options, error: optionsError } = await supabase!
            .from('task_parameter_options')
            .select('id, label, parameter_id')
            .eq('parameter_id', parameter.id)
            .order('label');

          if (optionsError) throw optionsError;

          return {
            parameter,
            options: options || []
          };
        })
      );

      return parametersWithOptions;
    },
  });
};

// Hook para obtener dependencias
const useParameterDependencies = () => {
  return useQuery({
    queryKey: ['parameter-dependencies-flow'],
    queryFn: async () => {
      const { data, error } = await supabase!
        .from('task_parameter_dependencies')
        .select('id, parent_parameter_id, parent_option_id, child_parameter_id');

      if (error) throw error;
      return data || [];
    },
  });
};

// Hook para crear dependencia
const useCreateDependency = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      parentParameterId,
      parentOptionId,
      childParameterId,
    }: {
      parentParameterId: string;
      parentOptionId: string;
      childParameterId: string;
    }) => {
      const { data, error } = await supabase!
        .from('task_parameter_dependencies')
        .insert({
          parent_parameter_id: parentParameterId,
          parent_option_id: parentOptionId,
          child_parameter_id: childParameterId
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar TODAS las queries relacionadas con parámetros y dependencias
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
      
      toast({
        title: "Dependencia creada",
        description: "La conexión entre parámetros ha sido guardada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la dependencia. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

// Hook para eliminar dependencia
const useDeleteDependency = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      parentParameterId,
      parentOptionId,
      childParameterId,
    }: {
      parentParameterId: string;
      parentOptionId: string;
      childParameterId: string;
    }) => {
      const { error } = await supabase!
        .from('task_parameter_dependencies')
        .delete()
        .eq('parent_parameter_id', parentParameterId)
        .eq('parent_option_id', parentOptionId)
        .eq('child_parameter_id', childParameterId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar TODAS las queries relacionadas con parámetros y dependencias
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
      
      toast({
        title: "Dependencia eliminada",
        description: "La conexión ha sido eliminada exitosamente.",
      });
    },
  });
};

// Hook para obtener posiciones guardadas
const useParameterPositions = () => {
  return useQuery({
    queryKey: ['parameter-positions'],
    queryFn: async () => {

      const { data, error } = await supabase!
        .from('task_parameter_positions')
        .select('*');

      if (error) {
        throw error;
      }

      return data as TaskParameterPosition[];
    },
  });
};

// Hook para guardar/actualizar posición
const useSaveParameterPosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (position: any) => {

      
      // Si tiene un ID específico (nodo duplicado), actualizar por ID
      if (position.id) {
        const { data, error } = await supabase!
          .from('task_parameter_positions')
          .update({
            x: position.x,
            y: position.y,
            visible_options: position.visible_options,
            updated_at: new Date().toISOString()
          })
          .eq('id', position.id)
          .select();

        if (error) {
          throw error;
        }

        return data;
      }
      
      // Para nodos originales, buscar por parameter_id donde id = parameter_id
      const { data: existing } = await supabase!
        .from('task_parameter_positions')
        .select('id')
        .eq('parameter_id', position.parameter_id)
        .eq('id', position.parameter_id) // Nodo original: id === parameter_id
        .single();

      if (existing) {
        // Si existe, actualizar
        const { data, error } = await supabase!
          .from('task_parameter_positions')
          .update({
            x: position.x,
            y: position.y,
            visible_options: position.visible_options,
            updated_at: new Date().toISOString()
          })
          .eq('id', position.parameter_id)
          .select();

        if (error) {
          throw error;
        }

        return data;
      } else {
        // Si no existe, crear nuevo registro original
        const insertData = {
          parameter_id: position.parameter_id,
          x: position.x,
          y: position.y,
          visible_options: position.visible_options
        };
        
        const { data, error } = await supabase!
          .from('task_parameter_positions')
          .insert(insertData)
          .select();

        if (error) {
          throw error;
        }

        return data;
      }
    },
    onSuccess: () => {
      // Invalidar TODAS las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ['parameter-positions'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
    },
    onError: (error) => {
    },
  });
};

// Componente principal del editor
function ParameterNodeEditorContent() {
  const { data: parametersData = [], isLoading: parametersLoading } = useParametersWithOptions();
  const { data: dependencies = [], isLoading: dependenciesLoading } = useParameterDependencies();
  const { data: savedPositions = [], isLoading: positionsLoading } = useParameterPositions();
  
  const createDependencyMutation = useCreateDependency();
  const deleteDependencyMutation = useDeleteDependency();
  const savePositionMutation = useSaveParameterPosition();
  const { setViewport, getViewport } = useReactFlow();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useGlobalModalStore();

// Componente separado para el botón que accede a ReactFlow
function AddParameterButton() {
  const { openModal } = useGlobalModalStore();
  
  const handleAddParameter = () => {
    // Obtener el centro del viewport actual
    const reactFlowInstance = window.reactFlowInstance;
    if (reactFlowInstance) {
      const viewport = reactFlowInstance.getViewport();
      
      // Calcular las coordenadas del centro del viewport
      // El canvas tiene 600px de alto, asumimos ~800px de ancho
      const viewportCenterX = Math.round(-viewport.x / viewport.zoom + (400)); // 400px es aproximadamente la mitad del ancho visible
      const viewportCenterY = Math.round(-viewport.y / viewport.zoom + (300)); // 300px es la mitad del alto (600px)
      
      openModal('add-parameter-to-canvas', {
        viewportCenter: {
          x: viewportCenterX,
          y: viewportCenterY
        }
      });
    } else {
      // Fallback si no hay instancia disponible
      openModal('add-parameter-to-canvas', {
        viewportCenter: { x: 0, y: 0 }
      });
    }
  };

  return (
    <Button 
      onClick={handleAddParameter}
      className="absolute top-4 right-4 z-10 rounded-full w-10 h-10 p-0"
      size="sm"
      title="Agregar parámetro al canvas"
    >
      <Plus className="w-4 h-4" />
    </Button>
  );
}

  // Debug: mostrar estado de carga de posiciones
  useEffect(() => {

  }, [positionsLoading, savedPositions.length]);

  // Botón de test para verificar que el guardado funciona
  const testSavePosition = async () => {
    if (parametersData.length > 0) {
      const firstParam = parametersData[0];

      savePositionMutation.mutate({
        parameter_id: firstParam.parameter.id,
        x: 100,
        y: 50,
        visible_options: firstParam.options.slice(0, 3).map(opt => opt.id)
      });
    }
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Estado para tracking de opciones visibles POR NODO INDIVIDUAL (usando node.id)
  const [nodeVisibleOptions, setNodeVisibleOptions] = useState<Record<string, string[]>>({});
  // Estado para tracking de nodos eliminados (evitar recreación automática)
  const [deletedNodeIds, setDeletedNodeIds] = useState<Set<string>>(new Set());

  // Tipos de nodos - definidos fuera para evitar recreación
  const nodeTypes = useMemo(() => ({
    parameterNode: ParameterNode,
  }), []);

  // Función para duplicar un nodo (crear visualización adicional)
  const handleDuplicateNode = useCallback(async (parameterId: string) => {

    const originalParameter = parametersData.find(item => item.parameter.id === parameterId);
    if (!originalParameter) return;

    // Encontrar posición para el nuevo nodo (ligeramente desplazado del original)
    const originalNode = nodes.find(n => n.data.parameter.id === parameterId);
    const newPosition = originalNode ? 
      { x: originalNode.position.x + 20, y: originalNode.position.y + 20 } :
      { x: 20, y: 20 };

    try {
      // Obtener opciones visibles del nodo original (buscar por cualquier nodo del mismo parámetro)
      const originalVisibleOptions = Object.keys(nodeVisibleOptions).find(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        return node?.data.parameter.id === parameterId;
      });
      
      const defaultVisibleOptions = originalVisibleOptions 
        ? nodeVisibleOptions[originalVisibleOptions]
        : originalParameter.options.slice(0, 3).map(opt => opt.id);

      // Crear una nueva entrada en la base de datos para el nodo duplicado
      const { data: dbPosition, error } = await supabase!
        .from('task_parameter_positions')
        .insert({
          parameter_id: parameterId, // El mismo parameter_id que el original
          x: Math.round(newPosition.x),
          y: Math.round(newPosition.y),
          visible_options: defaultVisibleOptions
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: "No se pudo duplicar el parámetro" });
        return;
      }

      // Usar el UUID generado por Supabase como ID del nodo duplicado
      const duplicateId = dbPosition.id;
      
      // Establecer las opciones visibles INMEDIATAMENTE para el nuevo nodo
      setNodeVisibleOptions(prev => ({
        ...prev,
        [duplicateId]: defaultVisibleOptions
      }));

      const duplicateNode: Node = {
        id: duplicateId,
        type: 'parameterNode',
        position: newPosition,
        data: {
          parameter: originalParameter.parameter,
          options: originalParameter.options,
          visibleOptions: defaultVisibleOptions,
          onVisibleOptionsChange: (optionIds: string[]) => {
            setNodeVisibleOptions(prev => ({
              ...prev,
              [duplicateId]: optionIds  // Usar el ID único del nodo duplicado
            }));
            // Actualizar las opciones visibles en la base de datos
            savePositionMutation.mutate({
              id: duplicateId,
              parameter_id: parameterId,
              x: Math.round(newPosition.x),
              y: Math.round(newPosition.y),
              visible_options: optionIds
            });
          },
          onDuplicate: handleDuplicateNode,
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
          onConfigureVisibility: handleConfigureVisibility,
          hasParentDependencies: getParameterWithParentDependencies(parameterId)
        }
      };

      setNodes(prev => [...prev, duplicateNode]);

      toast({ title: "Parámetro duplicado", description: "Nueva visualización creada exitosamente" });
      
    } catch (error) {
      toast({ title: "Error", description: "No se pudo duplicar el parámetro" });
    }
  }, [parametersData, nodes, nodeVisibleOptions, toast, savePositionMutation, supabase]);

  // Función para editar un parámetro (abrir modal)
  const handleEditNode = useCallback((parameterId: string) => {
    // Buscar el parámetro en los datos cargados
    const parameterData = parametersData.find(item => item.parameter.id === parameterId);
    if (parameterData) {
      // Abrir el modal centralizado de edición de parámetros
      const { openModal } = useGlobalModalStore.getState();
      openModal('task-parameter', { parameter: parameterData.parameter, isEditing: true });
    }
  }, [parametersData]);

  // Función para configurar visibilidad de opciones por parámetro padre
  const handleConfigureVisibility = useCallback((parameterId: string) => {
    const { openModal } = useGlobalModalStore.getState();
    openModal('parameter-visibility-config', { parameterId });
  }, []);

  // Función para detectar si un parámetro tiene dependencias padre
  const getParameterWithParentDependencies = useCallback((parameterId: string) => {
    return dependencies.some(dep => dep.child_parameter_id === parameterId);
  }, [dependencies]);

  // Estado para rastrear nodos que se están eliminando
  const [deletingNodes, setDeletingNodes] = useState<Set<string>>(new Set());

  // Función para borrar un nodo del canvas (COMPLETAMENTE MEJORADA)
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    
    // Marcar el nodo como eliminado INMEDIATAMENTE para evitar recreación
    setDeletedNodeIds(prev => new Set(prev).add(nodeId));
    setDeletingNodes(prev => new Set(prev).add(nodeId));
    
    try {
      // Eliminar el nodo de la base de datos por ID
      const { error } = await supabase!
        .from('task_parameter_positions')
        .delete()
        .eq('id', nodeId);
        
      if (error) {
        toast({ title: "Error", description: "No se pudo eliminar el nodo" });
        // Si falla, remover de la lista de eliminados
        setDeletedNodeIds(prev => {
          const updated = new Set(prev);
          updated.delete(nodeId);
          return updated;
        });
        setDeletingNodes(prev => {
          const updated = new Set(prev);
          updated.delete(nodeId);
          return updated;
        });
        return;
      }
      
      toast({ title: "Nodo eliminado", description: "Visualización removida permanentemente" });
      
      // Actualizar la interfaz - remover del canvas
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      
      // Limpiar opciones visibles del nodo eliminado
      setNodeVisibleOptions(prev => {
        const updated = { ...prev };
        delete updated[nodeId];
        return updated;
      });
      
      // Revalidar datos para evitar inconsistencias
      queryClient.invalidateQueries({ queryKey: ['parameter-positions'] });
      
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el nodo" });
      // Revertir marcado como eliminado si hay error
      setDeletedNodeIds(prev => {
        const updated = new Set(prev);
        updated.delete(nodeId);
        return updated;
      });
    } finally {
      // Remover del conjunto de procesamiento
      setDeletingNodes(prev => {
        const updated = new Set(prev);
        updated.delete(nodeId);
        return updated;
      });
    }
  }, [toast, supabase, queryClient]);

  // Manejo del pan con botón central del ratón
  useEffect(() => {
    let isPanning = false;
    let startPosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) { // Botón central del ratón
        e.preventDefault();
        isPanning = true;
        startPosition = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'move';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      
      const currentViewport = getViewport();
      const deltaX = (e.clientX - startPosition.x) * 2.0;
      const deltaY = (e.clientY - startPosition.y) * 2.0;
      
      setViewport({
        x: currentViewport.x + deltaX,
        y: currentViewport.y + deltaY,
        zoom: currentViewport.zoom
      });
      
      startPosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        isPanning = false;
        document.body.style.cursor = 'default';
      }
    };

    // Prevenir scroll con botón central
    const handleWheel = (e: WheelEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('wheel', handleWheel);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [getViewport, setViewport]);

  // Inicializar opciones visibles por primera vez desde posiciones guardadas (CORREGIDO PARA USAR NODE IDs)
  useEffect(() => {
    if (parametersData.length > 0 && savedPositions.length > 0 && Object.keys(nodeVisibleOptions).length === 0) {
      const newVisibleOptions: Record<string, string[]> = {};
      
      // Procesar CADA posición guardada como un nodo individual
      savedPositions.forEach((position) => {
        const parameterData = parametersData.find(item => item.parameter.id === position.parameter_id);
        if (parameterData) {
          if (position.visible_options && position.visible_options.length > 0) {
            // Usar opciones guardadas para ESTE nodo específico
            newVisibleOptions[position.id] = position.visible_options;
          } else {
            // Por defecto mostrar las primeras 5 opciones para ESTE nodo
            const defaultOptions = parameterData.options.slice(0, 5).map(opt => opt.id);
            newVisibleOptions[position.id] = defaultOptions;
          }
        }
      });
      
      setNodeVisibleOptions(newVisibleOptions);
    }
  }, [parametersData.length, savedPositions.length]);

  // Configurar nodos desde posiciones guardadas SOLAMENTE (filtrar eliminados)
  useEffect(() => {
    if (parametersData.length > 0 && Object.keys(nodeVisibleOptions).length > 0) {
      
      // 1. Crear nodos SOLO desde posiciones guardadas (FILTRAR ELIMINADOS)
      const nodesFromPositions: Node[] = savedPositions
        .filter(pos => !deletedNodeIds.has(pos.id)) // FILTRAR NODOS ELIMINADOS
        .map(pos => {
          // Buscar el parámetro correspondiente
          const parameterData = parametersData.find(item => item.parameter.id === pos.parameter_id);
          if (!parameterData) {
            return null;
          }
          
          const isOriginal = pos.id === pos.parameter_id;
          
          return {
            id: pos.id,
            type: 'parameterNode',
            position: { x: pos.x, y: pos.y },
            data: {
              parameter: parameterData.parameter,
              options: parameterData.options,
              visibleOptions: nodeVisibleOptions[pos.id] || pos.visible_options || [],
              onVisibleOptionsChange: (optionIds: string[]) => {
                setNodeVisibleOptions(prev => ({
                  ...prev,
                  [pos.id]: optionIds  // Usar pos.id (node ID), NO parameter ID
                }));
                
                // Guardar opciones visibles usando el ID del nodo específico
                savePositionMutation.mutate({
                  id: pos.id,  // Siempre usar el ID específico del nodo
                  parameter_id: pos.parameter_id,
                  x: pos.x,
                  y: pos.y,
                  visible_options: optionIds
                });
              },
              onDuplicate: handleDuplicateNode,
              onEdit: handleEditNode,
              onDelete: handleDeleteNode,
              onConfigureVisibility: handleConfigureVisibility,
              hasParentDependencies: getParameterWithParentDependencies(parameterData.parameter.id)
            },
          };
        })
        .filter(node => node !== null) as Node[];

      // Solo usar nodos desde posiciones guardadas (eliminada lógica de dependencias)
      setNodes(nodesFromPositions);
      
    }
  }, [parametersData.length, nodeVisibleOptions, savedPositions.length, deletedNodeIds]);

  // Configurar edges desde dependencias (OPTIMIZADO para evitar múltiples conexiones)
  useEffect(() => {
    if (dependencies.length > 0 && nodes.length > 0) {
      
      const initialEdges: Edge[] = dependencies.map((dep) => {
        // Buscar UN SOLO nodo representativo para cada parámetro (preferir nodos originales)
        const parentNodes = nodes.filter(node => node.data.parameter.id === dep.parent_parameter_id);
        const childNodes = nodes.filter(node => node.data.parameter.id === dep.child_parameter_id);
        
        // Seleccionar el PRIMER nodo que tiene la opción visible para parent
        const parentNode = parentNodes.find(node => 
          node.data.visibleOptions.includes(dep.parent_option_id)
        );
        
        // Seleccionar el PRIMER nodo child disponible
        const childNode = childNodes[0];
        
        if (!parentNode || !childNode) {
            parentNode: !!parentNode,
            childNode: !!childNode,
            parentOptionVisible: parentNode ? parentNode.data.visibleOptions.includes(dep.parent_option_id) : false
          });
          return null;
        }
        
        const edge = {
          id: `${dep.parent_parameter_id}-${dep.parent_option_id}-${dep.child_parameter_id}`,
          source: parentNode.id,
          sourceHandle: `${parentNode.id}-${dep.parent_option_id}`,
          target: childNode.id,
          targetHandle: `target-${childNode.id}`,
          type: 'default',
          animated: true,
          style: {
            stroke: '#10b981',
            strokeWidth: 3,
            cursor: 'pointer',
          },
          className: 'hoverable-edge',
          data: {
            parentParameterId: dep.parent_parameter_id,
            parentOptionId: dep.parent_option_id,
            childParameterId: dep.child_parameter_id
          }
        };
        
        return edge;
      }).filter(edge => edge !== null) as Edge[];

      setEdges(initialEdges);
    } else {
      setEdges([]);
    }
  }, [dependencies.length, nodes.length, nodeVisibleOptions]);

  // Manejar nuevas conexiones
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !params.sourceHandle) return;

      let sourceParamId = params.source;
      let targetParamId = params.target;
      
      // Verificar si el source es un nodo duplicado (id !== parameter_id)
      const sourceNode = nodes.find(n => n.id === params.source);
      if (sourceNode && sourceNode.id !== sourceNode.data.parameter.id) {
        sourceParamId = sourceNode.data.parameter.id;
      }
      
      // Verificar si el target es un nodo duplicado (id !== parameter_id)
      const targetNode = nodes.find(n => n.id === params.target);
      if (targetNode && targetNode.id !== targetNode.data.parameter.id) {
        targetParamId = targetNode.data.parameter.id;
      }

      // Extraer correctamente el option ID del sourceHandle
      // Format del sourceHandle: parameterId-optionId (donde ambos son UUIDs de 36 caracteres)
      // Los UUIDs tienen formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12 caracteres)
      const sourceOptionId = params.sourceHandle.slice(-36); // Últimos 36 caracteres son el optionId

      // Verificar que no sea una auto-conexión
      if (sourceParamId === targetParamId) {
        return;
      }

        parentParameterId: sourceParamId,
        parentOptionId: sourceOptionId,
        childParameterId: targetParamId
      });

      // Crear la dependencia en la base de datos
      createDependencyMutation.mutate({
        parentParameterId: sourceParamId,
        parentOptionId: sourceOptionId,
        childParameterId: targetParamId
      });
    },
    [createDependencyMutation, nodes]
  );

  // Manejar eliminación de conexiones
  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach((edge) => {
        if (edge.data) {
          deleteDependencyMutation.mutate({
            parentParameterId: edge.data.parentParameterId,
            parentOptionId: edge.data.parentOptionId,
            childParameterId: edge.data.childParameterId
          });
        }
      });
    },
    [deleteDependencyMutation]
  );

  if (parametersLoading || dependenciesLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando editor visual...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      {/* Canvas de React Flow */}
      <div className="h-[600px] border rounded-lg overflow-hidden relative" style={{ backgroundColor: 'var(--card-bg)' }}>
        {/* Botón flotante para agregar parámetros */}
        <AddParameterButton />
        
        {/* Componente interno que tiene acceso a ReactFlow */}
        {React.createElement(() => {
          const reactFlowInstance = useReactFlow();
          
          // Guardar la instancia en window para acceso desde AddParameterButton
          React.useEffect(() => {
            window.reactFlowInstance = reactFlowInstance;
          }, [reactFlowInstance]);
          
          return null;
        })}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeDragStop={(event, node) => {
            
            // Si el nodo se está eliminando, no guardar la posición
            if (deletingNodes.has(node.id)) {
              return;
            }
            
            // Detectar si es un nodo duplicado: id !== parameter_id
            const isDuplicateNode = node.id !== node.data.parameter.id;
            
            if (isDuplicateNode) {
                id: node.id,
                parameter_id: node.data.parameter.id,
                x: Math.round(node.position.x),
                y: Math.round(node.position.y),
                visible_options: nodeVisibleOptions[node.id] || []
              });
              
              // Para nodos duplicados, actualizar directamente por ID
              savePositionMutation.mutate({
                id: node.id,
                parameter_id: node.data.parameter.id,
                x: Math.round(node.position.x),
                y: Math.round(node.position.y),
                visible_options: nodeVisibleOptions[node.id] || []
              });
            } else {
                parameter_id: node.id,
                x: Math.round(node.position.x),
                y: Math.round(node.position.y),
                visible_options: nodeVisibleOptions[node.id] || []
              });
              
              // Para nodos originales, usar parameter_id
              savePositionMutation.mutate({
                parameter_id: node.id,
                x: Math.round(node.position.x),
                y: Math.round(node.position.y),
                visible_options: nodeVisibleOptions[node.id] || []
              });
            }
          }}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          style={{ backgroundColor: 'var(--card-bg)' }}
          deleteKeyCode={['Backspace', 'Delete']}
          minZoom={0.2}
          maxZoom={2}
          snapToGrid={true}
          snapGrid={[15, 15]}
          connectionLineStyle={{ stroke: '#10b981', strokeWidth: 3 }}
          defaultEdgeOptions={{
            style: { stroke: '#10b981', strokeWidth: 3, cursor: 'pointer' },
            type: 'smoothstep',
            animated: true,
          }}
          onEdgeClick={(event, edge) => {
            setSelectedEdge(edge);
            setShowDeleteDialog(true);
          }}
          // Configuración de controles de interacción - estilo Autodesk
          panOnDrag={false} // Desactivar pan con click izquierdo
          selectionOnDrag={true} // Activar selección múltiple con arrastre del fondo
          panOnScroll={false} // Desactivar pan con scroll
          zoomOnScroll={true} // Mantener zoom con scroll
          zoomOnPinch={true} // Zoom con pinch en móvil

        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
      
      {/* Debug info */}
      <div className="text-xs text-muted-foreground">
        Nodos: {nodes.length} | Conexiones: {edges.length} | Dependencias en BD: {dependencies.length}
      </div>
      
      {/* Dialog de confirmación para eliminar conexión */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conexión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la dependencia entre parámetros.
              ¿Estás seguro de que deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedEdge?.data) {
                  deleteDependencyMutation.mutate({
                    parentParameterId: selectedEdge.data.parentParameterId,
                    parentOptionId: selectedEdge.data.parentOptionId,
                    childParameterId: selectedEdge.data.childParameterId
                  });
                }
                setShowDeleteDialog(false);
                setSelectedEdge(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* CSS personalizado para efectos hover */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .react-flow__edge.hoverable-edge:hover path {
            stroke-width: 6 !important;
            stroke: #059669 !important;
          }
          .react-flow__edge {
            transition: all 0.2s ease;
          }
        `
      }} />
    </div>
  );
}

// Componente wrapper con ReactFlowProvider
export function ParameterNodeEditor() {
  return (
    <ReactFlowProvider>
      <ParameterNodeEditorContent />
    </ReactFlowProvider>
  );
}