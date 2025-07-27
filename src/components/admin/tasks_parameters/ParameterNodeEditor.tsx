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
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
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
}

// Componente de nodo personalizado
function ParameterNode({ data, id }: NodeProps<ParameterNodeData>) {
  const { parameter, options } = data;

  return (
    <div className="relative">
      <Card className="min-w-[250px] max-w-[300px] border-2 shadow-lg bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-center">
            {parameter.label}
          </CardTitle>
          <Badge variant="outline" className="text-xs self-center">
            {parameter.slug}
          </Badge>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {options.map((option) => (
            <div
              key={option.id}
              className="relative flex items-center justify-between py-1 px-2 rounded bg-muted/50 text-xs"
            >
              <span className="truncate pr-2">{option.label}</span>
              {/* Handle de salida para cada opción */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${parameter.id}-${option.id}`}
                style={{
                  right: -8,
                  width: 12,
                  height: 12,
                  backgroundColor: '#10b981',
                  border: '2px solid #ffffff',
                  borderRadius: '50%',
                  zIndex: 10,
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
          left: -8,
          top: '50%',
          width: 16,
          height: 16,
          backgroundColor: '#3b82f6',
          border: '2px solid #ffffff',
          borderRadius: '50%',
          zIndex: 10,
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

// Componente principal del editor
function ParameterNodeEditorContent() {
  const { data: parametersData = [], isLoading: parametersLoading } = useParametersWithOptions();
  const { data: dependencies = [], isLoading: dependenciesLoading } = useParameterDependencies();
  
  const createDependencyMutation = useCreateDependency();
  const deleteDependencyMutation = useDeleteDependency();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Tipos de nodos - definidos fuera para evitar recreación
  const nodeTypes = useMemo(() => ({
    parameterNode: ParameterNode,
  }), []);

  // Configurar nodos desde datos de parámetros
  useEffect(() => {
    if (parametersData.length > 0) {
      const initialNodes: Node[] = parametersData.map((item, index) => ({
        id: item.parameter.id,
        type: 'parameterNode',
        position: { 
          x: (index % 3) * 320, // 3 columnas
          y: Math.floor(index / 3) * 200 // Separación vertical
        },
        data: {
          parameter: item.parameter,
          options: item.options
        },
      }));

      setNodes(initialNodes);
    }
  }, [parametersData.length]);

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
      <style jsx>{`
        .react-flow__edge.hoverable-edge:hover path {
          stroke-width: 6 !important;
          stroke: #059669 !important;
        }
        .react-flow__edge {
          transition: all 0.2s ease;
        }
      `}</style>
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