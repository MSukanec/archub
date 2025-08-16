import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Table } from '@/components/ui-custom/Table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Edit, Trash2, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

interface Changelog {
  id: string
  version: string
  title: string
  description: string
  category: string
  is_featured: boolean
  created_at: string
  updated_at: string
}

const AdminCommunityChangelog = () => {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [featuredFilter, setFeaturedFilter] = useState('all')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { openModal } = useGlobalModalStore()

  // Fetch changelogs
  const { data: changelogs = [], isLoading } = useQuery({
    queryKey: ['admin-changelogs', searchValue, sortBy, categoryFilter, featuredFilter],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      let query = supabase
        .from('changelogs')
        .select('*')
      
      // Apply filters
      if (searchValue) {
        query = query.or(`title.ilike.%${searchValue}%,description.ilike.%${searchValue}%,version.ilike.%${searchValue}%`)
      }
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }
      
      if (featuredFilter !== 'all') {
        query = query.eq('is_featured', featuredFilter === 'featured')
      }
      
      // Apply sorting
      if (sortBy === 'version') {
        query = query.order('version', { ascending: true })
      } else if (sortBy === 'title') {
        query = query.order('title', { ascending: true })
      } else if (sortBy === 'category') {
        query = query.order('category', { ascending: true })
      } else {
        query = query.order('created_at', { ascending: false })
      }
      
      const { data, error } = await query
      if (error) throw error
      
      console.log('Changelogs:', data)
      return data
    }
  })

  // Delete changelog mutation
  const deleteChangelogMutation = useMutation({
    mutationFn: async (changelogId: string) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('changelogs')
        .delete()
        .eq('id', changelogId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-changelogs'] })
      toast({
        title: 'Changelog eliminado',
        description: 'El changelog ha sido eliminado exitosamente.',
      })
    },
    onError: (error) => {
      console.error('Error deleting changelog:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el changelog.',
        variant: 'destructive',
      })
    }
  })

  const handleEdit = (changelog: Changelog) => {
    openModal('admin-changelog', { changelog, isEditing: true })
  }

  const handleDeleteDangerous = (changelog: Changelog) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Changelog',
      description: `¿Estás seguro de que deseas eliminar el changelog "${changelog.title}" (${changelog.version})? Esta acción no se puede deshacer.`,
      itemName: `${changelog.title} (${changelog.version})`,
      onConfirm: () => deleteChangelogMutation.mutate(changelog.id),
      dangerous: true
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'feature':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'bugfix':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'improvement':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'security':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const columns = [
    {
      key: 'version',
      label: 'Versión',
      width: '15%',
      render: (changelog: Changelog) => (
        <span className="font-mono text-sm font-medium">{changelog.version}</span>
      )
    },
    {
      key: 'title',
      label: 'Título',
      width: '25%',
      render: (changelog: Changelog) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{changelog.title}</span>
          <span className="text-xs text-muted-foreground line-clamp-2">{changelog.description}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Categoría',
      width: '15%',
      render: (changelog: Changelog) => (
        <Badge className={`text-xs ${getCategoryColor(changelog.category)}`}>
          {changelog.category}
        </Badge>
      )
    },
    {
      key: 'is_featured',
      label: 'Destacado',
      width: '15%',
      render: (changelog: Changelog) => (
        <Badge variant={changelog.is_featured ? 'default' : 'secondary'} className="text-xs">
          {changelog.is_featured ? 'Sí' : 'No'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      width: '15%',
      render: (changelog: Changelog) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(changelog.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '15%',
      render: (changelog: Changelog) => (
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEdit(changelog)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDeleteDangerous(changelog)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Changelogs Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            data={changelogs}
            columns={columns}
            isLoading={isLoading}
            emptyState={
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No se encontraron changelogs</p>
                <p className="text-xs">No hay changelogs que coincidan con los filtros aplicados.</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminCommunityChangelog