import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Plus, Edit, Copy, Trash2, Settings, ChevronRight, ChevronDown, AlertTriangle, Search, ArrowRight, Minus } from 'lucide-react'
import { useTaskParametersAdmin } from '@/hooks/use-task-parameters-admin'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface ParameterNode {
  id: string
  slug: string
  label: string
  type: string
  parentId: string | null
  order: number
  level: number
  children: ParameterNode[]
  isExpanded?: boolean
  hasCircularDependency?: boolean
}

interface EditingState {
  parameterId: string | null
  field: 'label' | 'slug' | 'parent' | 'order' | null
  value: string
}

interface HierarchyValidation {
  circularDependencies: string[]
  orphanParameters: string[]
  duplicateSlugs: string[]
}

export function EditableParametersTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingState, setEditingState] = useState<EditingState>({ parameterId: null, field: null, value: '' })
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const { data: parameters = [], isLoading } = useTaskParametersAdmin()
  const { openModal } = useGlobalModalStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Organizar parámetros en estructura jerárquica
  const hierarchicalParameters = buildHierarchy(parameters)
  
  // Filtrar parámetros por búsqueda (incluye hijos si el padre coincide)
  const filteredParameters = searchTerm 
    ? filterParametersWithSearch(hierarchicalParameters, searchTerm)
    : hierarchicalParameters

  // Validar jerarquía
  const hierarchyValidation = validateHierarchy(parameters)

  // Mutation para actualizar parámetro
  const updateParameterMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      if (!supabase) throw new Error('Supabase not available')
      
      const { error } = await supabase
        .from('task_parameters')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      return { id, updates }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] })
      toast({
        title: "Parámetro actualizado",
        description: "Los cambios se han guardado correctamente.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar",
        description: "No se pudo guardar el cambio. Inténtalo de nuevo.",
        variant: "destructive"
      })
    }
  })

  function buildHierarchy(params: any[]): ParameterNode[] {
    const paramMap = new Map<string, ParameterNode>()
    const rootNodes: ParameterNode[] = []

    // Crear nodos y mapearlos
    params.forEach(param => {
      paramMap.set(param.id, {
        id: param.id,
        slug: param.slug,
        label: param.label,
        type: param.type,
        parentId: (param as any).parent_id || null,
        order: (param as any).order || 0,
        level: 0,
        children: [],
        isExpanded: expandedNodes.has(param.id),
        hasCircularDependency: false
      })
    })

    // Construir jerarquía y calcular niveles
    params.forEach(param => {
      const node = paramMap.get(param.id)
      if (!node) return

      if ((param as any).parent_id) {
        const parent = paramMap.get((param as any).parent_id)
        if (parent) {
          parent.children.push(node)
          node.level = parent.level + 1
        } else {
          // Padre no encontrado, convertir en raíz
          rootNodes.push(node)
        }
      } else {
        rootNodes.push(node)
      }
    })

    // Calcular niveles recursivamente
    function calculateLevels(nodes: ParameterNode[], level: number = 0) {
      nodes.forEach(node => {
        node.level = level
        calculateLevels(node.children, level + 1)
      })
    }
    calculateLevels(rootNodes)

    // Ordenar por order dentro de cada nivel
    function sortChildren(nodes: ParameterNode[]) {
      nodes.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
      nodes.forEach(node => sortChildren(node.children))
    }
    sortChildren(rootNodes)

    return rootNodes
  }

  function filterParametersWithSearch(params: ParameterNode[], searchTerm: string): ParameterNode[] {
    function nodeMatches(node: ParameterNode): boolean {
      return node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
             node.slug.toLowerCase().includes(searchTerm.toLowerCase())
    }

    function filterNode(node: ParameterNode): ParameterNode | null {
      const childMatches = node.children.map(filterNode).filter(Boolean) as ParameterNode[]
      
      if (nodeMatches(node) || childMatches.length > 0) {
        return {
          ...node,
          children: childMatches
        }
      }
      
      return null
    }

    return params.map(filterNode).filter(Boolean) as ParameterNode[]
  }

  function validateHierarchy(params: any[]): HierarchyValidation {
    const circularDependencies: string[] = []
    const orphanParameters: string[] = []
    const duplicateSlugs: string[] = []
    
    // Detectar slugs duplicados
    const slugCounts = new Map<string, number>()
    params.forEach(param => {
      const count = slugCounts.get(param.slug) || 0
      slugCounts.set(param.slug, count + 1)
    })
    
    slugCounts.forEach((count, slug) => {
      if (count > 1) {
        duplicateSlugs.push(slug)
      }
    })

    // Detectar dependencias circulares
    function hasCircularDependency(paramId: string, visited: Set<string> = new Set()): boolean {
      if (visited.has(paramId)) return true
      
      const param = params.find(p => p.id === paramId)
      if (!param || !(param as any).parent_id) return false
      
      visited.add(paramId)
      return hasCircularDependency((param as any).parent_id, visited)
    }

    params.forEach(param => {
      if ((param as any).parent_id && hasCircularDependency(param.id)) {
        circularDependencies.push(param.label)
      }
    })

    // Detectar parámetros huérfanos (tienen parent_id pero el padre no existe)
    params.forEach(param => {
      if ((param as any).parent_id && !params.find(p => p.id === (param as any).parent_id)) {
        orphanParameters.push(param.label)
      }
    })

    return { circularDependencies, orphanParameters, duplicateSlugs }
  }

  function getAvailableParents(currentParamId: string): any[] {
    // Excluir el parámetro actual y sus descendientes para evitar loops
    function getDescendants(paramId: string): string[] {
      const descendants: string[] = []
      const children = parameters.filter(p => (p as any).parent_id === paramId)
      
      children.forEach(child => {
        descendants.push(child.id)
        descendants.push(...getDescendants(child.id))
      })
      
      return descendants
    }

    const excludeIds = new Set([currentParamId, ...getDescendants(currentParamId)])
    return parameters.filter(param => !excludeIds.has(param.id))
  }

  function handleEdit(parameterId: string, field: 'label' | 'slug' | 'parent' | 'order', currentValue: string) {
    setEditingState({ parameterId, field, value: currentValue })
  }

  function handleSave() {
    if (!editingState.parameterId || !editingState.field) return

    const updates: any = {}
    
    // Convertir valores según el campo
    if (editingState.field === 'order') {
      updates[editingState.field] = parseInt(editingState.value) || 0
    } else if (editingState.field === 'parent') {
      updates.parent_id = editingState.value || null
    } else {
      updates[editingState.field] = editingState.value
    }

    updateParameterMutation.mutate({
      id: editingState.parameterId,
      updates
    })

    setEditingState({ parameterId: null, field: null, value: '' })
  }

  function handleCancel() {
    setEditingState({ parameterId: null, field: null, value: '' })
  }

  function toggleExpanded(nodeId: string) {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  function renderParameterRow(param: ParameterNode, index: number) {
    const isEditing = editingState.parameterId === param.id

    return (
      <div key={param.id} className="border border-muted-foreground/20 rounded-lg">
        <div className="grid grid-cols-12 gap-4 p-3 items-center">
          {/* Expand/Collapse + Nombre */}
          <div className="col-span-3 flex items-center gap-2" style={{ paddingLeft: `${param.level * 20}px` }}>
            {/* Líneas de jerarquía visual */}
            {param.level > 0 && (
              <div className="flex items-center">
                {Array.from({ length: param.level }).map((_, i) => (
                  <div key={i} className="w-4 h-4 flex items-center justify-center">
                    {i === param.level - 1 ? (
                      <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                    ) : (
                      <Minus className="h-3 w-3 text-muted-foreground/30 rotate-90" />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {param.children.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className=""
                onClick={() => toggleExpanded(param.id)}
              >
                {param.isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            )}
            
            <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            
            {isEditing && editingState.field === 'label' ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editingState.value}
                  onChange={(e) => setEditingState(prev => ({ ...prev, value: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  className="h-6 text-sm"
                  autoFocus
                />
                <Button size="sm" variant="ghost" className="" onClick={handleSave}>✓</Button>
                <Button size="sm" variant="ghost" className="" onClick={handleCancel}>✕</Button>
              </div>
            ) : (
              <span 
                className="font-medium text-sm cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded flex-1"
                onClick={() => handleEdit(param.id, 'label', param.label)}
              >
                {param.label}
              </span>
            )}
          </div>

          {/* Slug */}
          <div className="col-span-2">
            {isEditing && editingState.field === 'slug' ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingState.value}
                  onChange={(e) => setEditingState(prev => ({ ...prev, value: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  className="h-6 text-sm"
                  autoFocus
                />
                <Button size="sm" variant="ghost" className="" onClick={handleSave}>✓</Button>
                <Button size="sm" variant="ghost" className="" onClick={handleCancel}>✕</Button>
              </div>
            ) : (
              <Badge 
                variant="outline" 
                className="text-xs cursor-pointer hover:bg-muted/50"
                onClick={() => handleEdit(param.id, 'slug', param.slug)}
              >
                {param.slug}
              </Badge>
            )}
          </div>

          {/* Parent */}
          <div className="col-span-2">
            {isEditing && editingState.field === 'parent' ? (
              <div className="flex items-center gap-2">
                <Select
                  value={editingState.value}
                  onValueChange={(value) => setEditingState(prev => ({ ...prev, value }))}
                >
                  <SelectTrigger className="h-6 text-xs">
                    <SelectValue placeholder="Sin padre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin padre</SelectItem>
                    {getAvailableParents(param.id).map(parentParam => (
                      <SelectItem key={parentParam.id} value={parentParam.id}>
                        {parentParam.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" className="" onClick={handleSave}>✓</Button>
                <Button size="sm" variant="ghost" className="" onClick={handleCancel}>✕</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {param.parentId ? (
                  <Badge 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEdit(param.id, 'parent', param.parentId || '')}
                  >
                    {parameters.find(p => p.id === param.parentId)?.label || 'Padre no encontrado'}
                  </Badge>
                ) : (
                  <span 
                    className="text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                    onClick={() => handleEdit(param.id, 'parent', '')}
                  >
                    Sin padre
                  </span>
                )}
                {param.hasCircularDependency && (
                  <AlertTriangle className="h-3 w-3 text-yellow-500" title="Dependencia circular detectada" />
                )}
              </div>
            )}
          </div>

          {/* Orden */}
          <div className="col-span-1">
            {isEditing && editingState.field === 'order' ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={editingState.value}
                  onChange={(e) => setEditingState(prev => ({ ...prev, value: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  className="h-6 text-sm w-16"
                  autoFocus
                />
                <Button size="sm" variant="ghost" className="" onClick={handleSave}>✓</Button>
                <Button size="sm" variant="ghost" className="" onClick={handleCancel}>✕</Button>
              </div>
            ) : (
              <span 
                className="text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                onClick={() => handleEdit(param.id, 'order', param.order.toString())}
              >
                {param.order}
              </span>
            )}
          </div>

          {/* Tipo */}
          <div className="col-span-2">
            <Badge variant="secondary" className="text-xs">
              {param.type}
            </Badge>
          </div>

          {/* Acciones */}
          <div className="col-span-2 flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              className=""
              onClick={() => openModal('task-parameter', { parameter: param })}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className=""
              onClick={() => {
                // TODO: Implementar duplicar
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className=" text-destructive hover:text-destructive"
              onClick={() => {
                openModal('delete-confirmation', {
                  title: 'Eliminar Parámetro',
                  description: '¿Estás seguro de que deseas eliminar este parámetro?',
                  itemName: param.label,
                  onConfirm: () => {
                    // TODO: Implementar eliminación
                  }
                })
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Hijos (cuando esté expandido) */}
        {param.isExpanded && param.children.length > 0 && (
          <div className="border-t border-muted-foreground/20">
            {param.children.map((child, childIndex) => renderParameterRow(child, childIndex))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Cargando parámetros...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y botón nuevo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gestión de Parámetros
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Tabla editable para gestionar la jerarquía y orden de parámetros de tareas
              </p>
            </div>
            <Button
              onClick={() => openModal('task-parameter')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Parámetro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Búsqueda */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Alertas de problemas */}
          {(hierarchyValidation.circularDependencies.length > 0 || 
            hierarchyValidation.orphanParameters.length > 0 || 
            hierarchyValidation.duplicateSlugs.length > 0) && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Problemas detectados en la jerarquía:
                </span>
              </div>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 ml-6 space-y-1">
                {hierarchyValidation.circularDependencies.map((dep: string, index: number) => (
                  <li key={`circular-${index}`}>• Dependencia circular: {dep}</li>
                ))}
                {hierarchyValidation.orphanParameters.map((orphan: string, index: number) => (
                  <li key={`orphan-${index}`}>• Parámetro huérfano: {orphan}</li>
                ))}
                {hierarchyValidation.duplicateSlugs.map((slug: string, index: number) => (
                  <li key={`duplicate-${index}`}>• Slug duplicado: {slug}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de parámetros */}
      <Card>
        <CardHeader>
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground">
            <div className="col-span-3">Parámetro</div>
            <div className="col-span-2">Slug</div>
            <div className="col-span-2">Padre</div>
            <div className="col-span-1">Orden</div>
            <div className="col-span-2">Tipo</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredParameters.length === 0 ? (
            <EmptyState
              icon={<Settings className="w-12 h-12 text-muted-foreground" />}
              title={searchTerm ? "No se encontraron parámetros" : "No hay parámetros"}
              description={searchTerm 
                ? 'Prueba ajustando el término de búsqueda' 
                : 'Comienza creando tu primer parámetro para gestionar las tareas'
              }
            />
          ) : (
            filteredParameters.map((param, index) => renderParameterRow(param, index))
          )}
        </CardContent>
      </Card>
    </div>
  )
}