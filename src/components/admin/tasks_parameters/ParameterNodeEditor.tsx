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
  ReactFlowInstance,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { TaskParameter, TaskParameterOption, TaskParameterDependency, InsertTaskParameterDependency } from '@shared/schema';
import { Save, Trash2, Plus, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface ParameterNodeData {
  parameter: TaskParameter;
  options: TaskParameterOption[];
}

interface CustomNodeProps extends NodeProps {
  data: ParameterNodeData;
}

// Custom Parameter Node Component
function ParameterNode({ data, id }: CustomNodeProps) {
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
        {options.map((option, index) => (
          <div
            key={option.id}
            className="relative flex items-center justify-between py-1 px-2 rounded bg-muted/50 text-xs"
          >
            <span className="truncate pr-2">{option.label}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={`${parameter.id}-${option.id}`}
              className="!w-3 !h-3 !bg-accent !border-2 !border-accent-foreground !right-[-6px] !transform !translate-y-0"
              style={{ top: 'auto', bottom: 'auto' }}
            />
          </div>
        ))}
        
        {/* Target handle for incoming connections */}
        <Handle
          type="target"
          position={Position.Left}
          id={`target-${parameter.id}`}
          className="!w-4 !h-4 !bg-primary !border-2 !border-primary-foreground !left-[-8px]"
        />
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

      return parametersWithOptions.filter(p => p.options.length > 0);
    }
  });
};

// Hook para obtener dependencias existentes
const useParameterDependencies = () => {
  return useQuery({
    queryKey: ['parameter-dependencies-flow'],
    queryFn: async () => {
      const { data, error } = await supabase!
        .from('task_parameter_dependencies')
        .select(`
          *,
          parent_parameter:task_parameters!parent_parameter_id(*),
          parent_option:task_parameter_options!parent_option_id(*),
          child_parameter:task_parameters!child_parameter_id(*)
        `);
      
      if (error) throw error;
      return data;
    }
  });
};

// Componente principal del editor
function ParameterNodeEditorContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reactFlow = useReactFlow();

  const { data: parametersData = [], isLoading: parametersLoading } = useParametersWithOptions();
  const { data: dependencies = [], isLoading: dependenciesLoading } = useParameterDependencies();

  // Tipos de nodos personalizados
  const nodeTypes = useMemo(() => ({
    parameterNode: ParameterNode,
  }), []);

  // Mutación para crear dependencia
  const createDependencyMutation = useMutation({
    mutationFn: async ({ parentParameterId, parentOptionId, childParameterId }: {
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
      toast({
        title: "Error",
        description: "No se pudo crear la dependencia. Verifica que no exista ya.",
        variant: "destructive",
      });
      console.error('Error creating dependency:', error);
    }
  });

  // Mutación para eliminar dependencia
  const deleteDependencyMutation = useMutation({
    mutationFn: async ({ parentParameterId, parentOptionId, childParameterId }: {
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
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la dependencia.",
        variant: "destructive",
      });
      console.error('Error deleting dependency:', error);
    }
  });

  // Configurar nodos iniciales
  useEffect(() => {
    if (parametersData.length > 0) {
      const initialNodes: Node[] = parametersData.map((paramData, index) => ({
        id: paramData.parameter.id,
        type: 'parameterNode',
        position: {
          x: (index % 3) * 350 + 50,
          y: Math.floor(index / 3) * 200 + 50
        },
        data: paramData,
        draggable: true,
      }));

      setNodes(initialNodes);
    }
  }, [parametersData, setNodes]);

  // Configurar edges desde dependencias existentes
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
        data: {
          parentParameterId: dep.parent_parameter_id,
          parentOptionId: dep.parent_option_id,
          childParameterId: dep.child_parameter_id
        }
      }));

      setEdges(initialEdges);
    }
  }, [dependencies, setEdges]);

  // Manejar nuevas conexiones
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !params.sourceHandle) return;

      // Extraer IDs de los handles
      const [sourceParamId, sourceOptionId] = params.sourceHandle.split('-');
      const targetParamId = params.target;

      // Verificar que no sea una auto-conexión
      if (sourceParamId === targetParamId) {
        toast({
          title: "Conexión inválida",
          description: "No puedes conectar un parámetro consigo mismo.",
          variant: "destructive",
        });
        return;
      }

      // Crear la conexión visual primero
      const newEdge: Edge = {
        id: `${sourceParamId}-${sourceOptionId}-${targetParamId}`,
        source: params.source,
        sourceHandle: params.sourceHandle,
        target: params.target,
        targetHandle: params.targetHandle,
        type: 'default',
        animated: true,
        style: {
          stroke: 'hsl(var(--accent))',
          strokeWidth: 2,
        },
        data: {
          parentParameterId: sourceParamId,
          parentOptionId: sourceOptionId,
          childParameterId: targetParamId
        }
      };

      setEdges((eds) => addEdge(newEdge, eds));

      // Guardar en la base de datos
      createDependencyMutation.mutate({
        parentParameterId: sourceParamId,
        parentOptionId: sourceOptionId,
        childParameterId: targetParamId
      });
    },
    [setEdges, createDependencyMutation, toast]
  );

  // Manejar eliminación de edges
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

  // Funciones de zoom y ajuste
  const onFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  }, [reactFlowInstance]);

  const onZoomIn = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  }, [reactFlowInstance]);

  const onZoomOut = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  }, [reactFlowInstance]);

  if (parametersLoading || dependenciesLoading) {
    return (
      <div className="h-[600px] flex items-center justify-center text-muted-foreground">
        Cargando editor visual de dependencias...
      </div>
    );
  }

  if (parametersData.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <h3 className="font-medium mb-2">No hay parámetros disponibles</h3>
          <p className="text-sm text-muted-foreground">
            Crea parámetros de tipo "select" con opciones para usar el editor visual.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Editor Visual de Dependencias</h3>
          <p className="text-sm text-muted-foreground">
            Conecta opciones de parámetros para crear dependencias tipo "árbol genealógico"
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onFitView}>
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="h-[700px] border rounded-lg overflow-hidden bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className="bg-background"
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            className="opacity-30"
          />
          <Controls 
            position="bottom-right"
            className="bg-background border rounded shadow-lg"
          />
        </ReactFlow>
      </div>

      {/* Instrucciones */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-2">Instrucciones de uso:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Conectar:</strong> Arrastra desde el pin de una opción (círculo pequeño) hacia otro parámetro</li>
            <li>• <strong>Mover nodos:</strong> Arrastra los nodos para reorganizar el diagrama</li>
            <li>• <strong>Eliminar conexión:</strong> Selecciona una línea y presiona Delete o Backspace</li>
            <li>• <strong>Zoom:</strong> Usa la rueda del mouse o los controles en la esquina inferior derecha</li>
            <li>• <strong>Auto-ajuste:</strong> Haz clic en el botón de maximizar para centrar todos los nodos</li>
          </ul>
        </CardContent>
      </Card>
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