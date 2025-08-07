import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui-custom/EmptyState'
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
      console.error('Error updating parameter:', error)
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
          {/* Expand/Collapse + Nombre */}
            {/* Líneas de jerarquía visual */}
            {param.level > 0 && (
                {Array.from({ length: param.level }).map((_, i) => (
                    {i === param.level - 1 ? (
                    ) : (
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {param.children.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(param.id)}
              >
              </Button>
            )}
            
            
            {isEditing && editingState.field === 'label' ? (
                <Input
                  value={editingState.value}
                  onChange={(e) => setEditingState(prev => ({ ...prev, value: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <span 
                onClick={() => handleEdit(param.id, 'label', param.label)}
              >
                {param.label}
              </span>
            )}
          </div>

          {/* Slug */}
            {isEditing && editingState.field === 'slug' ? (
                <Input
                  value={editingState.value}
                  onChange={(e) => setEditingState(prev => ({ ...prev, value: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <Badge 
                variant="outline" 
                onClick={() => handleEdit(param.id, 'slug', param.slug)}
              >
                {param.slug}
              </Badge>
            )}
          </div>

          {/* Parent */}
            {isEditing && editingState.field === 'parent' ? (
                <Select
                  value={editingState.value}
                  onValueChange={(value) => setEditingState(prev => ({ ...prev, value }))}
                >
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
              </div>
            ) : (
                {param.parentId ? (
                  <Badge 
                    variant="secondary" 
                    onClick={() => handleEdit(param.id, 'parent', param.parentId || '')}
                  >
                    {parameters.find(p => p.id === param.parentId)?.label || 'Padre no encontrado'}
                  </Badge>
                ) : (
                  <span 
                    onClick={() => handleEdit(param.id, 'parent', '')}
                  >
                    Sin padre
                  </span>
                )}
                {param.hasCircularDependency && (
                )}
              </div>
            )}
          </div>

          {/* Orden */}
            {isEditing && editingState.field === 'order' ? (
                <Input
                  type="number"
                  value={editingState.value}
                  onChange={(e) => setEditingState(prev => ({ ...prev, value: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <span 
                onClick={() => handleEdit(param.id, 'order', param.order.toString())}
              >
                {param.order}
              </span>
            )}
          </div>

          {/* Tipo */}
              {param.type}
            </Badge>
          </div>

          {/* Acciones */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('task-parameter', { parameter: param })}
            >
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // TODO: Implementar duplicar
                console.log('Duplicar parámetro:', param.id)
              }}
            >
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                openModal('delete-confirmation', {
                  title: 'Eliminar Parámetro',
                  description: '¿Estás seguro de que deseas eliminar este parámetro?',
                  itemName: param.label,
                  onConfirm: () => {
                    // TODO: Implementar eliminación
                    console.log('Eliminar parámetro:', param.id)
                  }
                })
              }}
            >
            </Button>
          </div>
        </div>

        {/* Hijos (cuando esté expandido) */}
        {param.isExpanded && param.children.length > 0 && (
            {param.children.map((child, childIndex) => renderParameterRow(child, childIndex))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
      {/* Header con búsqueda y botón nuevo */}
      <Card>
        <CardHeader>
            <div>
                Gestión de Parámetros
              </CardTitle>
                Tabla editable para gestionar la jerarquía y orden de parámetros de tareas
              </p>
            </div>
            <Button
              onClick={() => openModal('task-parameter')}
            >
              Nuevo Parámetro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Búsqueda */}
              <Input
                placeholder="Buscar por nombre o slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Alertas de problemas */}
          {(hierarchyValidation.circularDependencies.length > 0 || 
            hierarchyValidation.orphanParameters.length > 0 || 
            hierarchyValidation.duplicateSlugs.length > 0) && (
                  Problemas detectados en la jerarquía:
                </span>
              </div>
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
          </div>
        </CardHeader>
          {filteredParameters.length === 0 ? (
            <EmptyState
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