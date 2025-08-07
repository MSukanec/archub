import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Link, Settings, Plus, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui-custom/EmptyState'
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
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
            ) : (
            )}
          </Button>
        )}
        
        
              {node.parameterSlug}
            </Badge>
          </div>
          
          {hasChildren && (
              {node.children.length} conexión{node.children.length !== 1 ? 'es' : ''}
            </Badge>
          )}
        </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // TODO: Implementar modal para crear dependencia
              console.log('Crear dependencia para:', node.parameterId)
            }}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
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
          </Button>
        </div>
      </div>

      {/* Conexiones/dependencias hijas */}
      {isExpanded && hasChildren && (
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
            {dependency.parentOptionLabel}
          </Badge>
        </div>
        
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // TODO: Implementar modal para editar dependencia
              console.log('Editar dependencia:', dependency.dependencyId)
            }}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              openModal('delete-confirmation', {
                title: 'Eliminar Dependencia',
                description: '¿Estás seguro de que deseas eliminar esta conexión de dependencia?',
                itemName: `${dependency.parentOptionLabel} → ${dependency.childParameter.label}`,
                onConfirm: () => {
                  // TODO: Implementar eliminación de dependencia
                  console.log('Eliminar dependencia:', dependency.dependencyId)
                }
              })
            }}
          >
          </Button>
        </div>
      </div>

            {dependency.childParameter.slug}
          </Badge>
        </div>
      </div>

      {dependency.childOptions.length > 0 && (
            {dependency.childOptions.map((option) => (
                {option.label}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {dependency.childOptions.length === 0 && (
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
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (dependencyTree.length === 0) {
    return (
      <EmptyState
        description="Comienza creando conexiones entre parámetros para establecer dependencias condicionales."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
          Árbol de Dependencias de Parámetros
        </CardTitle>
          Visualiza y gestiona las conexiones entre parámetros. Los parámetros raíz se muestran primero, 
          seguidos de sus dependencias condicionadas por opciones específicas.
        </p>
      </CardHeader>
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