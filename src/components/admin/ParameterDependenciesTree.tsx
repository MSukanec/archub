import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Link, Settings, Plus, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useParameterDependenciesTree, ParameterDependencyNode, ParameterDependencyChild } from '@/hooks/use-parameter-dependencies-tree'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

interface DependencyNodeProps {
  node: ParameterDependencyNode
  level: number
}

function DependencyNode({ node, level }: DependencyNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { openModal } = useGlobalModalStore()
  const hasChildren = node.children.length > 0

  return (
    <div className={`${level > 0 ? 'ml-6 border-l border-muted-foreground/20 pl-4' : ''}`}>
      {/* Nodo del parámetro */}
      <div className="flex items-center gap-2 py-2">
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className=""
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {!hasChildren && <div className="w-6" />}
        
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{node.parameterLabel}</span>
            <Badge variant="outline" className="text-xs">
              {node.parameterSlug}
            </Badge>
          </div>
          
          {hasChildren && (
            <Badge variant="secondary" className="text-xs">
              {node.children.length} conexión{node.children.length !== 1 ? 'es' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className=""
            onClick={() => {
              // TODO: Implementar modal para crear dependencia
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className=""
            onClick={() => {
              openModal('task-parameter', {
                parameter: {
                  id: node.parameterId,
                  slug: node.parameterSlug,
                  label: node.parameterLabel
                }
              })
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Conexiones/dependencias hijas */}
      {isExpanded && hasChildren && (
        <div className="ml-6 space-y-2">
          {node.children.map((child) => (
            <DependencyConnection 
              key={child.dependencyId} 
              dependency={child} 
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface DependencyConnectionProps {
  dependency: ParameterDependencyChild
  level: number
}

function DependencyConnection({ dependency, level }: DependencyConnectionProps) {
  const { openModal } = useGlobalModalStore()

  return (
    <div className="border border-muted-foreground/20 rounded-lg p-3 bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-blue-500" />
          <span className="text-xs text-muted-foreground">Cuando se selecciona:</span>
          <Badge variant="default" className="text-xs">
            {dependency.parentOptionLabel}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className=""
            onClick={() => {
              // TODO: Implementar modal para editar dependencia
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className=" text-destructive hover:text-destructive"
            onClick={() => {
              openModal('delete-confirmation', {
                title: 'Eliminar Dependencia',
                description: '¿Estás seguro de que deseas eliminar esta conexión de dependencia?',
                itemName: `${dependency.parentOptionLabel} → ${dependency.childParameter.label}`,
                onConfirm: () => {
                  // TODO: Implementar eliminación de dependencia
                }
              })
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-muted-foreground">Se muestra el parámetro:</span>
        <div className="flex items-center gap-2">
          <Settings className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium text-sm">{dependency.childParameter.label}</span>
          <Badge variant="outline" className="text-xs">
            {dependency.childParameter.slug}
          </Badge>
        </div>
      </div>

      {dependency.childOptions.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Opciones configuradas:</span>
          <div className="flex flex-wrap gap-1">
            {dependency.childOptions.map((option) => (
              <Badge key={option.id} variant="secondary" className="text-xs">
                {option.label}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {dependency.childOptions.length === 0 && (
        <div className="text-xs text-muted-foreground italic">
          No hay opciones específicas configuradas (se muestran todas)
        </div>
      )}
    </div>
  )
}

export function ParameterDependenciesTree() {
  const { data: dependencyTree = [], isLoading, error } = useParameterDependenciesTree()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Cargando árbol de dependencias...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-destructive">Error al cargar las dependencias</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (dependencyTree.length === 0) {
    return (
      <EmptyState
        icon={<Link className="w-12 h-12 text-muted-foreground" />}
        title="No hay dependencias configuradas"
        description="Comienza creando conexiones entre parámetros para establecer dependencias condicionales."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Árbol de Dependencias de Parámetros
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualiza y gestiona las conexiones entre parámetros. Los parámetros raíz se muestran primero, 
          seguidos de sus dependencias condicionadas por opciones específicas.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {dependencyTree.map((rootNode) => (
          <DependencyNode 
            key={rootNode.id} 
            node={rootNode} 
            level={0}
          />
        ))}
      </CardContent>
    </Card>
  )
}