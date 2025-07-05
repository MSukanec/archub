import { useState } from 'react'
import { Search, Plus, ChevronRight, ChevronDown, Edit, Trash2, Package2, Settings, CheckCircle, XCircle, MoreHorizontal, Filter, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

import { Layout } from '@/components/layout/desktop/Layout'
import { useMovementConceptsAdmin, useDeleteMovementConcept, type MovementConceptAdmin } from '@/hooks/use-movement-concepts-admin'
import { NewAdminMovementConceptModal } from '@/modals/admin/NewAdminMovementConceptModal'

export default function AdminMovementConcepts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set())
  const [systemFilter, setSystemFilter] = useState<'all' | 'system' | 'custom'>('all')
  
  // Modal states
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false)
  const [editingConcept, setEditingConcept] = useState<MovementConceptAdmin | null>(null)
  
  // Delete confirmation states
  const [deleteConceptId, setDeleteConceptId] = useState<string | null>(null)

  const { data: concepts = [], isLoading } = useMovementConceptsAdmin()
  const deleteConceptMutation = useDeleteMovementConcept()

  // Calculate statistics
  const calculateStats = (concepts: MovementConceptAdmin[]) => {
    let totalConcepts = 0
    let systemConcepts = 0
    let customConcepts = 0
    let parentConcepts = 0

    const countRecursive = (cons: MovementConceptAdmin[]) => {
      cons.forEach(concept => {
        totalConcepts++
        if (concept.is_system) {
          systemConcepts++
        } else {
          customConcepts++
        }
        if (!concept.parent_id) {
          parentConcepts++
        }
        
        if (concept.children && concept.children.length > 0) {
          countRecursive(concept.children)
        }
      })
    }

    countRecursive(concepts)

    return {
      totalConcepts,
      systemConcepts,
      customConcepts,
      parentConcepts
    }
  }

  const stats = calculateStats(concepts)

  // Filter and search concepts
  const filteredConcepts = concepts.filter(concept => {
    const matchesSearch = concept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (concept.description && concept.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSystemFilter = systemFilter === 'all' || 
                               (systemFilter === 'system' && concept.is_system) ||
                               (systemFilter === 'custom' && !concept.is_system)
    
    return matchesSearch && matchesSystemFilter
  })

  const toggleExpanded = (conceptId: string) => {
    const newExpanded = new Set(expandedConcepts)
    if (newExpanded.has(conceptId)) {
      newExpanded.delete(conceptId)
    } else {
      newExpanded.add(conceptId)
    }
    setExpandedConcepts(newExpanded)
  }

  const handleEditConcept = (concept: MovementConceptAdmin) => {
    setEditingConcept(concept)
    setIsConceptModalOpen(true)
  }

  const handleDeleteConcept = async () => {
    if (!deleteConceptId) return
    
    try {
      await deleteConceptMutation.mutateAsync(deleteConceptId)
      setDeleteConceptId(null)
    } catch (error) {
      console.error('Error deleting concept:', error)
    }
  }

  const renderConcept = (concept: MovementConceptAdmin, level = 0) => {
    const hasChildren = concept.children && concept.children.length > 0
    const isExpanded = expandedConcepts.has(concept.id)

    return (
      <div key={concept.id} className="space-y-2">
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(concept.id)}>
          <div className={`flex items-center justify-between p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors ${level > 0 ? 'ml-6' : ''}`}>
            <div className="flex items-center space-x-3 flex-1">
              {hasChildren && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{concept.name}</h4>
                  <Badge variant={concept.is_system ? "default" : "secondary"}>
                    {concept.is_system ? "Sistema" : "Personalizado"}
                  </Badge>
                  {concept.parent_id && (
                    <Badge variant="outline" className="text-xs">
                      Subcategoría
                    </Badge>
                  )}
                </div>
                {concept.description && (
                  <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Creado: {new Date(concept.created_at).toLocaleDateString()}</span>
                  {hasChildren && (
                    <span>{concept.children!.length} subcategorías</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditConcept(concept)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  {!concept.is_system && (
                    <DropdownMenuItem 
                      onClick={() => setDeleteConceptId(concept.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <CollapsibleContent>
            {hasChildren && (
              <div className="space-y-2">
                {concept.children!.map((child: MovementConceptAdmin) => 
                  renderConcept(child, level + 1)
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Layout
        title="Conceptos de Movimientos"
        description="Gestiona los conceptos de movimientos financieros del sistema"
        hideHeader
        icon={Package2}
        actions={[]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando conceptos...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Conceptos de Movimientos"
      description="Gestiona los conceptos de movimientos financieros del sistema"
      hideHeader
      icon={Package2}
      actions={[
        <Button 
          key="new-concept"
          onClick={() => {
            setEditingConcept(null)
            setIsConceptModalOpen(true)
          }}
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Concepto
        </Button>
      ]}
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conceptos</CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConcepts}</div>
              <p className="text-xs text-muted-foreground">Conceptos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistema</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.systemConcepts}</div>
              <p className="text-xs text-muted-foreground">Conceptos del sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personalizados</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customConcepts}</div>
              <p className="text-xs text-muted-foreground">Conceptos personalizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Principales</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.parentConcepts}</div>
              <p className="text-xs text-muted-foreground">Conceptos padre</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conceptos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="system-filter" className="text-sm font-medium whitespace-nowrap">
                Tipo:
              </Label>
              <Select value={systemFilter} onValueChange={(value: 'all' | 'system' | 'custom') => setSystemFilter(value)}>
                <SelectTrigger className="w-[130px]" id="system-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(searchTerm || systemFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSystemFilter('all')
                }}
                className="h-10"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Concepts List */}
        <div className="space-y-4">
          {filteredConcepts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron conceptos</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || systemFilter !== 'all' 
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Comienza creando tu primer concepto de movimiento'
                  }
                </p>
                {!searchTerm && systemFilter === 'all' && (
                  <Button 
                    onClick={() => {
                      setEditingConcept(null)
                      setIsConceptModalOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Concepto
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredConcepts.map(concept => renderConcept(concept))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewAdminMovementConceptModal
        open={isConceptModalOpen}
        onClose={() => {
          setIsConceptModalOpen(false)
          setEditingConcept(null)
        }}
        editingConcept={editingConcept}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConceptId} onOpenChange={() => setDeleteConceptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar concepto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El concepto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConcept}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}