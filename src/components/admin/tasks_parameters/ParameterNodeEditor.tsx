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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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
    <Card className="min-w-[250px] max-w-[300px] border-2 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-center">
          {parameter.label}
        </CardTitle>
        <Badge variant="outline" className="text-xs self-center">
          {parameter.slug}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        {/* Handle de entrada */}
        <Handle
          type="target"
          position={Position.Left}
          id={`target-${parameter.id}`}
          className="!w-4 !h-4 !bg-primary !border-2 !border-primary-foreground !left-[-8px]"
        />
        
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
              className="!w-3 !h-3 !bg-accent !border-2 !border-accent-foreground !right-[-6px]"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Hook para obtener parámetros con opciones
const useParametersWithOptions = () => {
  return useQuery({
    queryKey: ['parameters-with-options'],
    queryFn: async () => {
      const { data: parameters, error: paramsError } = await supabase!
        .from('task_parameters')
        .select('*')
        .eq('type', 'select')
        .order('label');

      if (paramsError) throw paramsError;

      const parametersWithOptions = await Promise.all(
        parameters.map(async (parameter) => {
          const { data: options, error: optionsError } = await supabase!
            .from('task_parameter_options')
            .select('*')
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
        .select('*');

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
  }, [parametersData, setNodes]);

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
          stroke: 'hsl(var(--accent))',
          strokeWidth: 2,
        },
      }));

      setEdges(initialEdges);
    } else {
      setEdges([]);
    }
  }, [dependencies, setEdges]);

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

  return (
    <div className="space-y-4">
      {/* Información del editor */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Editor Visual de Dependencias</h3>
        <p className="text-sm text-muted-foreground">
          Conecta opciones de parámetros para crear dependencias tipo "árbol genealógico".
        </p>
      </div>

      {/* Canvas de React Flow */}
      <div className="h-[600px] border rounded-lg overflow-hidden bg-background">
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
          className="bg-background"
          deleteKeyCode={['Backspace', 'Delete']}
          minZoom={0.2}
          maxZoom={2}
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
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