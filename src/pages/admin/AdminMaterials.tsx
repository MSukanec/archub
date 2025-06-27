import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Layout } from '@/components/layout/Layout'
import { CustomTable } from '@/components/ui-custom/misc/CustomTable'
import { NewAdminMaterialModal } from '@/modals/NewAdminMaterialModal'

import { Plus, MoreHorizontal, Edit, Trash2, Package, Crown } from 'lucide-react'

interface Material {
  id: string
  name: string
  unit_id: string
  cost: number
  category_id: string
  created_at: string
}

export default function AdminMaterials() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [newMaterialModalOpen, setNewMaterialModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null)

  const queryClient = useQueryClient()

  // Fetch materials with statistics
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['admin-materials', searchValue, sortBy, categoryFilter],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      let query = supabase
        .from('materials')
        .select('*')
      
      // Apply filters
      if (searchValue) {
        query = query.ilike('name', `%${searchValue}%`)
      }
      
      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter)
      }
      
      // Apply sorting
      if (sortBy === 'name') {
        query = query.order('name', { ascending: true })
      } else if (sortBy === 'cost') {
        query = query.order('cost', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }
      
      const { data, error } = await query
      if (error) throw error
      
      return data || []
    }
  })

  // Statistics calculations
  const totalMaterials = materials.length
  const averageCost = materials.length > 0 ? materials.reduce((sum, mat) => sum + (mat.cost || 0), 0) / materials.length : 0
  const highValueMaterials = materials.filter(mat => (mat.cost || 0) > 1000).length
  const recentMaterials = materials.filter(mat => {
    const createdDate = new Date(mat.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return createdDate > weekAgo
  }).length

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId)
      
      if (error) throw error
      return materialId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-materials'] })
      toast({
        title: "Material eliminado",
        description: "El material ha sido eliminado correctamente."
      })
      setDeletingMaterial(null)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el material.",
        variant: "destructive"
      })
    }
  })

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setNewMaterialModalOpen(true)
  }

  const handleDelete = (material: Material) => {
    setDeletingMaterial(material)
  }

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('name')
    setCategoryFilter('all')
  }

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      width: '5%',
      render: (material: Material) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(material.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Material',
      render: (material: Material) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{material.name}</span>
        </div>
      )
    },
    {
      key: 'cost',
      label: 'Costo',
      width: '5%',
      render: (material: Material) => (
        <Badge variant="outline" className="text-xs">
          ${material.cost?.toLocaleString() || '0'}
        </Badge>
      )
    },
    {
      key: 'unit_id',
      label: 'Unidad',
      width: '5%',
      render: (material: Material) => (
        <span className="text-xs text-muted-foreground">
          {material.unit_id || 'N/A'}
        </span>
      )
    },
    {
      key: 'category_id',
      label: 'Categoría',
      width: '5%',
      render: (material: Material) => (
        <span className="text-xs text-muted-foreground">
          {material.category_id || 'N/A'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '5%',
      render: (material: Material) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(material)}>
              <Edit className="mr-2 h-3 w-3" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(material)} className="text-red-600">
              <Trash2 className="mr-2 h-3 w-3" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]

  const customFilters = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="sort" className="text-xs">Ordenar:</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="cost">Costo</SelectItem>
            <SelectItem value="created_at">Fecha</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="category" className="text-xs">Categoría:</Label>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="construction">Construcción</SelectItem>
            <SelectItem value="electrical">Eléctrico</SelectItem>
            <SelectItem value="plumbing">Plomería</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const headerProps = {
    title: 'Materiales',
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: clearFilters,
    actions: [
      <Button 
        key="new-material"
        onClick={() => {
          setEditingMaterial(null)
          setNewMaterialModalOpen(true)
        }}
        size="sm"
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Nuevo Material
      </Button>
    ]
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Materiales</p>
                <p className="text-lg font-semibold">{totalMaterials}</p>
              </div>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Costo Promedio</p>
                <p className="text-lg font-semibold">${averageCost.toLocaleString()}</p>
              </div>
              <Crown className="h-4 w-4 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Alto Valor</p>
                <p className="text-lg font-semibold">{highValueMaterials}</p>
              </div>
              <Crown className="h-4 w-4 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Nuevos (7 días)</p>
                <p className="text-lg font-semibold">{recentMaterials}</p>
              </div>
              <Crown className="h-4 w-4 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Materials Table */}
        <CustomTable
          data={materials}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground">No hay materiales</h3>
              <p className="text-sm text-muted-foreground mt-1">No hay materiales que coincidan con los filtros seleccionados.</p>
            </div>
          }
        />
      </div>

      {/* Material Modal */}
      <NewAdminMaterialModal
        open={newMaterialModalOpen}
        onClose={() => {
          setNewMaterialModalOpen(false)
          setEditingMaterial(null)
        }}
        material={editingMaterial}
      />

      <AlertDialog open={!!deletingMaterial} onOpenChange={() => setDeletingMaterial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El material "{deletingMaterial?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingMaterial && deleteMaterialMutation.mutate(deletingMaterial.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}