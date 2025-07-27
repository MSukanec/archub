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
import { ComboBoxMultiSelect } from '@/components/ui-custom/ComboBoxMultiSelect';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { TaskParameterPosition, InsertTaskParameterPosition } from '@shared/schema';
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
}

// Componente de nodo personalizado
function ParameterNode({ data, id }: NodeProps<ParameterNodeData>) {
  const { parameter, options, visibleOptions, onVisibleOptionsChange } = data;
  
  const visibleOptionsList = options.filter(option => visibleOptions.includes(option.id));
  const comboBoxOptions = options.map(option => ({
    value: option.id,
    label: option.label
  }));

  return (
    <div className="relative">
      <Card className="min-w-[250px] max-w-[300px] border-2 shadow-lg bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-center">
            {parameter.label}
          </CardTitle>
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
                id={`${parameter.id}-${option.id}`}
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
        id={`target-${parameter.id}`}
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
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
      toast({
        title: "Dependencia creada",
        description: "La conexión entre parámetros ha sido guardada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error creating dependency:', error);
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
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
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
      console.log('📥 Cargando posiciones desde DB...');
      const { data, error } = await supabase!
        .from('task_parameter_positions')
        .select('*');

      if (error) {
        console.error('❌ Error cargando posiciones:', error);
        throw error;
      }
      console.log('📊 Posiciones cargadas desde DB:', data?.length || 0, 'registros');
      return data as TaskParameterPosition[];
    },
  });
};

// Hook para guardar/actualizar posición
const useSaveParameterPosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (position: InsertTaskParameterPosition) => {
      console.log('🔄 Intentando guardar en DB:', position);
      const { data, error } = await supabase!
        .from('task_parameter_positions')
        .upsert(position, { 
          onConflict: 'parameter_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('❌ Error guardando posición:', error);
        throw error;
      }
      console.log('✅ Posición guardada exitosamente:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter-positions'] });
    },
    onError: (error) => {
      console.error('❌ Error en mutación:', error);
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

  // Debug: mostrar estado de carga de posiciones
  useEffect(() => {
    console.log('🔄 Estado de posiciones:', { positionsLoading, savedPositions: savedPositions.length });
  }, [positionsLoading, savedPositions.length]);

  // Botón de test para verificar que el guardado funciona
  const testSavePosition = async () => {
    if (parametersData.length > 0) {
      const firstParam = parametersData[0];
      console.log('🧪 Test: Guardando posición manual para:', firstParam.parameter.slug);
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
  const [nodeVisibleOptions, setNodeVisibleOptions] = useState<Record<string, string[]>>({});

  // Tipos de nodos - definidos fuera para evitar recreación
  const nodeTypes = useMemo(() => ({
    parameterNode: ParameterNode,
  }), []);

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
      const deltaX = (e.clientX - startPosition.x) * 0.5;
      const deltaY = (e.clientY - startPosition.y) * 0.5;
      
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

  // Inicializar opciones visibles por primera vez desde posiciones guardadas
  useEffect(() => {
    if (parametersData.length > 0 && Object.keys(nodeVisibleOptions).length === 0) {
      console.log('🔍 Inicializando opciones visibles. Posiciones guardadas:', savedPositions);
      const newVisibleOptions: Record<string, string[]> = {};
      parametersData.forEach((item) => {
        const savedPosition = savedPositions.find(pos => pos.parameter_id === item.parameter.id);
        if (savedPosition && savedPosition.visible_options.length > 0) {
          // Usar opciones guardadas
          console.log('✅ Usando opciones guardadas para:', item.parameter.slug, savedPosition.visible_options);
          newVisibleOptions[item.parameter.id] = savedPosition.visible_options;
        } else {
          // Por defecto mostrar las primeras 5 opciones
          const defaultOptions = item.options.slice(0, 5).map(opt => opt.id);
          console.log('🔧 Usando opciones por defecto para:', item.parameter.slug, defaultOptions);
          newVisibleOptions[item.parameter.id] = defaultOptions;
        }
      });
      setNodeVisibleOptions(newVisibleOptions);
    }
  }, [parametersData.length, savedPositions.length]);

  // Configurar nodos desde datos de parámetros con posiciones guardadas
  useEffect(() => {
    if (parametersData.length > 0 && Object.keys(nodeVisibleOptions).length > 0) {
      console.log('🎯 Configurando nodos. Parámetros:', parametersData.length, 'Posiciones guardadas:', savedPositions.length);
      const initialNodes: Node[] = parametersData.map((item, index) => {
        const savedPosition = savedPositions.find(pos => pos.parameter_id === item.parameter.id);
        
        const position = savedPosition ? { 
          x: savedPosition.x, 
          y: savedPosition.y 
        } : { 
          x: (index % 3) * 320, // 3 columnas
          y: Math.floor(index / 3) * 200 // Separación vertical
        };
        
        console.log(`📌 Nodo ${item.parameter.slug}:`, savedPosition ? 'posición guardada' : 'posición por defecto', position);
        
        return {
          id: item.parameter.id,
          type: 'parameterNode',
          position,
          data: {
            parameter: item.parameter,
            options: item.options,
            visibleOptions: nodeVisibleOptions[item.parameter.id] || [],
            onVisibleOptionsChange: (optionIds: string[]) => {
              setNodeVisibleOptions(prev => ({
                ...prev,
                [item.parameter.id]: optionIds
              }));
              
              // Guardar opciones visibles en la base de datos
              const currentNode = nodes.find(n => n.id === item.parameter.id);
              if (currentNode) {
                console.log('💾 Guardando opciones visibles:', {
                  parameter_id: item.parameter.id,
                  x: currentNode.position.x,
                  y: currentNode.position.y,
                  visible_options: optionIds
                });
                savePositionMutation.mutate({
                  parameter_id: item.parameter.id,
                  x: currentNode.position.x,
                  y: currentNode.position.y,
                  visible_options: optionIds
                });
              }
            }
          },
        };
      });

      setNodes(initialNodes);
    }
  }, [parametersData.length, nodeVisibleOptions, savedPositions.length]);

  // Configurar edges desde dependencias
  useEffect(() => {
    if (dependencies.length > 0) {
      const initialEdges: Edge[] = dependencies.map((dep) => ({
        id: `${dep.parent_parameter_id}-${dep.parent_option_id}-${dep.child_parameter_id}`,
        source: dep.parent_parameter_id,
        sourceHandle: `${dep.parent_parameter_id}-${dep.parent_option_id}`,
        target: dep.child_parameter_id,
        targetHandle: `target-${dep.child_parameter_id}`,
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
      }));

      setEdges(initialEdges);
    } else {
      setEdges([]);
    }
  }, [dependencies.length]);

  // Manejar nuevas conexiones
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !params.sourceHandle) return;

      const sourceParamId = params.source;
      const sourceOptionId = params.sourceHandle.replace(`${sourceParamId}-`, '');
      const targetParamId = params.target;

      // Verificar que no sea una auto-conexión
      if (sourceParamId === targetParamId) {
        return;
      }

      // Crear la dependencia en la base de datos
      createDependencyMutation.mutate({
        parentParameterId: sourceParamId,
        parentOptionId: sourceOptionId,
        childParameterId: targetParamId
      });
    },
    [createDependencyMutation]
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

  console.log('DEBUG - Parameters:', parametersData.length, 'Dependencies:', dependencies.length, 'Nodes:', nodes.length, 'Edges:', edges.length);

  return (
    <div className="space-y-4">
      {/* Canvas de React Flow */}
      <div className="h-[600px] border rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--card-bg)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeDragStop={(event, node) => {
            console.log('🎯 Nodo arrastrado y soltado:', node.id, 'nueva posición:', node.position);
            console.log('📍 Guardando posición de nodo:', {
              parameter_id: node.id,
              x: Math.round(node.position.x),
              y: Math.round(node.position.y),
              visible_options: nodeVisibleOptions[node.id] || []
            });
            savePositionMutation.mutate({
              parameter_id: node.id,
              x: Math.round(node.position.x),
              y: Math.round(node.position.y),
              visible_options: nodeVisibleOptions[node.id] || []
            });
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