import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Plus, Edit, Copy, Trash2, Settings, ChevronRight, ChevronDown, AlertTriangle, Search, ArrowRight } from 'lucide-react'
import { useTaskParametersAdmin } from '@/hooks/use-task-parameters-admin'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface ParameterDependency {
  id: string
  parent_parameter_id: string
  parent_option_id: string
  child_parameter_id: string
  parent_parameter?: {
    id: string
    slug: string
    label: string
  }
  child_parameter?: {
    id: string
    slug: string
    label: string
  }
  parent_option?: {
    id: string
    name: string
    label: string
  }
}

interface ParameterNode {
  id: string
  slug: string
  label: string
  type: string
  level: number
  children: ParameterNode[]
  isExpanded?: boolean
  dependencyInfo?: {
    parentParameterId: string
    parentOptionId: string
    parentParameterLabel: string
    parentOptionLabel: string
  }
}

interface EditingState {
  parameterId: string | null
  field: 'label' | 'slug' | null
  value: string
}

export default function EditableParametersTable() {
  const { data: parameters = [], isLoading, error } = useTaskParametersAdmin()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [editingState, setEditingState] = useState<EditingState>({
    parameterId: null,
    field: null,
    value: ''
  })
  
  const { openModal } = useGlobalModalStore()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Hook para obtener dependencias de parámetros
  const { data: dependencies = [], isLoading: isLoadingDependencies } = useQuery({
    queryKey: ['task-parameter-dependencies'],
    queryFn: async () => {
      console.log('🔍 Cargando dependencias de parámetros...')
      const { data, error } = await supabase
        .from('task_parameter_dependencies')
        .select(`
          id,
          parent_parameter_id,
          parent_option_id,
          child_parameter_id,
          parent_parameter:task_parameters!parent_parameter_id(id, slug, label),
          child_parameter:task_parameters!child_parameter_id(id, slug, label),
          parent_option:task_parameter_options!parent_option_id(id, name, label)
        `)

      if (error) {
        console.error('❌ Error al cargar dependencias:', error)
        throw error
      }
      
      console.log('✅ Dependencias cargadas:', data?.length || 0, 'registros')
      console.log('📊 Datos de dependencias:', data?.slice(0, 3))
      return data || []
    }
  })

  // Hook para actualizar parámetros
  const updateParameterMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('task_parameters')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] })
      toast({
        title: 'Parámetro actualizado',
        description: 'Los cambios se han guardado correctamente.'
      })
    },
    onError: (error) => {
      console.error('Error updating parameter:', error)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el parámetro.',
        variant: 'destructive',
      })
    }
  })

  // Crear estructura jerárquica basada en dependencias
  const hierarchicalData = createHierarchy(parameters, dependencies)

  function createHierarchy(params: any[], deps: ParameterDependency[]): ParameterNode[] {
    console.log('🏗️ Construyendo jerarquía con', params.length, 'parámetros y', deps.length, 'dependencias')
    
    const paramMap = new Map<string, ParameterNode>()
    
    // Crear nodos base
    params.forEach(param => {
      paramMap.set(param.id, {
        id: param.id,
        slug: param.slug,
        label: param.label,
        type: param.type,
        level: 0,
        children: [],
        isExpanded: expandedNodes.has(param.id)
      })
    })

    // Construir jerarquía basada en dependencias
    let hierarchyBuilt = 0
    deps.forEach(dep => {
      const parentNode = paramMap.get(dep.parent_parameter_id)
      const childNode = paramMap.get(dep.child_parameter_id)
      
      if (parentNode && childNode) {
        // Evitar duplicados en hijos
        if (!parentNode.children.find(child => child.id === childNode.id)) {
          parentNode.children.push(childNode)
          childNode.level = parentNode.level + 1
          childNode.dependencyInfo = {
            parentParameterId: dep.parent_parameter_id,
            parentOptionId: dep.parent_option_id,
            parentParameterLabel: dep.parent_parameter?.label || 'Parámetro desconocido',
            parentOptionLabel: dep.parent_option?.label || dep.parent_option?.name || 'Opción desconocida'
          }
          hierarchyBuilt++
        }
      } else {
        console.log('⚠️ Dependencia con parámetros faltantes:', {
          depId: dep.id,
          parentExists: !!parentNode,
          childExists: !!childNode,
          parentId: dep.parent_parameter_id,
          childId: dep.child_parameter_id
        })
      }
    })

    console.log('✅ Jerarquías construidas:', hierarchyBuilt)

    // Obtener nodos raíz (parámetros que no son hijos de otros)
    const childParameterIds = new Set(deps.map(dep => dep.child_parameter_id))
    const rootNodes = Array.from(paramMap.values()).filter(node => 
      !childParameterIds.has(node.id)
    )

    console.log('🌳 Nodos raíz encontrados:', rootNodes.length)
    console.log('📋 Parámetros hijo:', childParameterIds.size)

    // Ordenar alfabéticamente
    function sortNodes(nodes: ParameterNode[]) {
      nodes.sort((a, b) => a.label.localeCompare(b.label))
      nodes.forEach(node => sortNodes(node.children))
    }

    sortNodes(rootNodes)
    return rootNodes
  }

  // Filtrar datos jerárquicos por búsqueda
  const filteredData = searchQuery ? filterHierarchy(hierarchicalData, searchQuery) : hierarchicalData

  function filterHierarchy(nodes: ParameterNode[], query: string): ParameterNode[] {
    const filtered: ParameterNode[] = []
    
    nodes.forEach(node => {
      const matchesQuery = node.label.toLowerCase().includes(query.toLowerCase()) ||
                          node.slug.toLowerCase().includes(query.toLowerCase())
      
      const filteredChildren = filterHierarchy(node.children, query)
      
      if (matchesQuery || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren,
          isExpanded: true // Expandir automáticamente nodos con resultados
        })
      }
    })
    
    return filtered
  }

  // Validaciones
  const duplicateSlugs = getDuplicateSlugs(parameters)

  function getDuplicateSlugs(params: any[]): string[] {
    const slugCounts = new Map<string, number>()
    params.forEach(param => {
      slugCounts.set(param.slug, (slugCounts.get(param.slug) || 0) + 1)
    })
    
    return Array.from(slugCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([slug]) => slug)
  }

  function toggleExpanded(nodeId: string) {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  function handleEdit(parameterId: string, field: 'label' | 'slug', currentValue: string) {
    setEditingState({ parameterId, field, value: currentValue })
  }

  function handleSave() {
    if (!editingState.parameterId || !editingState.field) return

    const updates: any = {}
    updates[editingState.field] = editingState.value

    updateParameterMutation.mutate({
      id: editingState.parameterId,
      updates
    })

    setEditingState({ parameterId: null, field: null, value: '' })
  }

  function handleCancel() {
    setEditingState({ parameterId: null, field: null, value: '' })
  }

  function handleCreateParameter() {
    openModal('TaskParameterFormModal', { mode: 'create' })
  }

  function handleEditParameter(parameter: any) {
    openModal('TaskParameterFormModal', { mode: 'edit', parameter })
  }

  function handleDeleteParameter(parameterId: string) {
    // TODO: Implementar eliminación con confirmación
    console.log('Delete parameter:', parameterId)
  }

  function renderParameterRow(param: ParameterNode, index: number | string): React.ReactNode {
    const isEditing = editingState.parameterId === param.id
    const hasDuplicateSlug = duplicateSlugs.includes(param.slug)

    return (
      <div key={`param-${param.id}-${index}`} className="border border-muted-foreground/20 rounded-lg">
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
                      <div className="h-px w-3 bg-muted-foreground/30" />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {param.children.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
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
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleSave}>✓</Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCancel}>✕</Button>
              </div>
            ) : (
              <span 
                className="text-sm font-medium cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded flex-1"
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
                  className="h-6 text-xs"
                  autoFocus
                />
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleSave}>✓</Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCancel}>✕</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <code 
                  className="text-xs bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/70"
                  onClick={() => handleEdit(param.id, 'slug', param.slug)}
                >
                  {param.slug}
                </code>
                {hasDuplicateSlug && (
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                )}
              </div>
            )}
          </div>

          {/* Tipo */}
          <div className="col-span-1">
            <Badge variant="outline" className="text-xs">
              {param.type}
            </Badge>
          </div>

          {/* Dependencia (Padre) */}
          <div className="col-span-3">
            {param.dependencyInfo ? (
              <div className="flex flex-col gap-1">
                <Badge variant="secondary" className="text-xs">
                  {param.dependencyInfo.parentParameterLabel}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {param.dependencyInfo.parentOptionLabel}
                </Badge>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Sin dependencia</span>
            )}
          </div>

          {/* Hijos */}
          <div className="col-span-2">
            {param.children.length > 0 ? (
              <Badge variant="outline" className="text-xs">
                {param.children.length} hijo{param.children.length > 1 ? 's' : ''}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Sin hijos</span>
            )}
          </div>

          {/* Acciones */}
          <div className="col-span-1 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => handleEditParameter(param)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => handleDeleteParameter(param.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Hijos (cuando esté expandido) */}
        {param.isExpanded && param.children.length > 0 && (
          <div className="border-t border-muted-foreground/20">
            {param.children.map((child, childIndex) => renderParameterRow(child, `${index}-${childIndex}`))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading || isLoadingDependencies) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando parámetros...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error al cargar los parámetros: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Parámetros de Tareas (Vista Jerárquica)</CardTitle>
          <Button onClick={handleCreateParameter} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Parámetro
          </Button>
        </div>
        
        {/* Búsqueda */}
        <div className="flex items-center gap-2 mt-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar parámetros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Alertas de validación */}
        {duplicateSlugs.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Slugs duplicados encontrados: {duplicateSlugs.join(', ')}
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredData.length === 0 ? (
          <EmptyState
            icon={Settings}
            title="No hay parámetros"
            description={searchQuery ? "No se encontraron parámetros que coincidan con tu búsqueda." : "Crea tu primer parámetro para comenzar."}
            action={
              !searchQuery && (
                <Button onClick={handleCreateParameter} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Crear Parámetro
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {/* Encabezados */}
            <div className="grid grid-cols-12 gap-4 px-3 py-2 bg-muted rounded-lg text-xs font-medium text-muted-foreground">
              <div className="col-span-3">Nombre</div>
              <div className="col-span-2">Slug</div>
              <div className="col-span-1">Tipo</div>
              <div className="col-span-3">Dependencia</div>
              <div className="col-span-2">Hijos</div>
              <div className="col-span-1">Acciones</div>
            </div>

            {/* Datos */}
            <div className="space-y-2">
              {filteredData.map((param, index) => renderParameterRow(param, `root-${index}`))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}