import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { cn } from '@/lib/utils'

import { Plus, Edit, Trash2, Users, Crown, Copy, Wrench } from 'lucide-react'

interface LaborType {
  id: string
  name: string
  description: string | null
  unit_id: string | null
  is_system: boolean
  created_at: string
  updated_at: string | null
}

const AdminCostLabor = () => {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [groupingType, setGroupingType] = useState<'none' | 'system'>('system')
  
  const { openModal } = useGlobalModalStore()
  const queryClient = useQueryClient()

  // Fetch labor types
  const { data: laborTypes = [], isLoading } = useQuery({
    queryKey: ['labor-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('labor_types')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data || []
    }
  })

  // Delete mutation
  const deleteLaborTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('labor_types')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labor-types'] })
      toast({
        title: "Tipo de mano de obra eliminado",
        description: "El tipo de mano de obra ha sido eliminado correctamente.",
      })
    },
    onError: (error) => {
      console.error('Error deleting labor type:', error)
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el tipo de mano de obra.",
        variant: "destructive",
      })
    }
  })

  // Apply client-side filtering
  const filteredLaborTypes = laborTypes.filter(laborType => {
    const matchesSearch = searchValue === '' || laborType.name.toLowerCase().includes(searchValue.toLowerCase())
    return matchesSearch
  })

  // Apply client-side sorting
  const sortedLaborTypes = [...filteredLaborTypes].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  // Process labor types for grouping
  const processedLaborTypes = useMemo(() => {
    if (groupingType === 'none') {
      return sortedLaborTypes;
    }
    
    if (groupingType === 'system') {
      return sortedLaborTypes.map(laborType => ({
        ...laborType,
        groupKey: laborType.is_system ? 'Sistema' : 'Organización'
      }));
    }
    
    return sortedLaborTypes;
  }, [sortedLaborTypes, groupingType])

  const handleEdit = (laborType: LaborType) => {
    openModal('labor-type-form', { editingLaborType: laborType })
  }

  const handleCreate = () => {
    openModal('labor-type-form', { editingLaborType: null })
  }

  const handleDuplicate = (laborType: LaborType) => {
    openModal('labor-type-form', { 
      editingLaborType: laborType,
      isDuplicating: true 
    })
  }

  const handleDelete = (laborType: LaborType) => {
    // Crear lista de tipos de mano de obra disponibles para reemplazo (excluyendo el actual)
    const replacementOptions = laborTypes
      .filter(lt => lt.id !== laborType.id)
      .map(lt => ({
        value: lt.id,
        label: lt.name
      }))

    openModal('delete-confirmation', {
      mode: 'replace',
      title: 'Eliminar Tipo de Mano de Obra',
      description: `¿Estás seguro que deseas eliminar el tipo de mano de obra "${laborType.name}"? Esta acción no se puede deshacer.`,
      itemName: laborType.name,
      destructiveActionText: 'Eliminar Tipo de Mano de Obra',
      onDelete: () => deleteLaborTypeMutation.mutate(laborType.id),
      onReplace: (newLaborTypeId: string) => {
        // Aquí puedes implementar la lógica de reemplazo si es necesaria
        console.log('Reemplazar tipo de mano de obra', laborType.id, 'por', newLaborTypeId)
        // Por ahora solo eliminamos el tipo actual
        deleteLaborTypeMutation.mutate(laborType.id)
      },
      replacementOptions,
      currentCategoryId: laborType.id,
      isLoading: deleteLaborTypeMutation.isPending
    })
  }

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('name')
    setGroupingType('system')
  }

  // Render grouping popover content
  const renderGroupingContent = () => {
    const groupingOptions = [
      { value: 'none', label: 'Sin agrupar' },
      { value: 'system', label: 'Por origen (Sistema/Organización)' }
    ];

    return (
      <>
        <div className="text-xs font-medium mb-2 block">Agrupar por</div>
        <div className="space-y-1">
          {groupingOptions.map((option) => (
            <Button
              key={option.value}
              variant={groupingType === option.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setGroupingType(option.value as 'none' | 'system')}
              className={cn(
                "w-full justify-start text-xs font-normal h-8",
                groupingType === option.value ? "button-secondary-pressed hover:bg-secondary" : ""
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </>
    );
  };

  // Definir columnas de la tabla
  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (laborType: LaborType) => (
        <div className="flex items-center gap-2">
          <div>
            <div className="font-medium">{laborType.name}</div>
            {laborType.description && (
              <div className="text-xs text-muted-foreground">{laborType.description}</div>
            )}
          </div>
          {laborType.is_system && (
            <Crown className="h-4 w-4 text-amber-500" title="Tipo del sistema" />
          )}
        </div>
      )
    },
    {
      key: 'origin',
      label: 'Origen',
      sortable: false,
      render: (laborType: LaborType) => (
        <Badge variant={laborType.is_system ? "secondary" : "default"}>
          {laborType.is_system ? 'Sistema' : 'Organización'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha de creación',
      sortable: true,
      render: (laborType: LaborType) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(laborType.created_at), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (laborType: LaborType) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(laborType)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDuplicate(laborType)}
            className="h-8 w-8 p-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {!laborType.is_system && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(laborType)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      data={processedLaborTypes}
      isLoading={isLoading}
      groupBy={groupingType === 'none' ? undefined : 'groupKey'}
      topBar={{
        showSearch: true,
        searchValue: searchValue,
        onSearchChange: setSearchValue,
        renderGroupingContent: renderGroupingContent,
        isGroupingActive: groupingType !== 'none',
        showClearFilters: searchValue !== '' || groupingType !== 'system',
        onClearFilters: clearFilters
      }}
      renderCard={(laborType: LaborType) => (
        <div key={laborType.id} className="p-4 border rounded-lg bg-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium">{laborType.name}</h3>
                {laborType.is_system && (
                  <Crown className="h-4 w-4 text-amber-500" title="Tipo del sistema" />
                )}
              </div>
              {laborType.description && (
                <p className="text-sm text-muted-foreground mb-2">{laborType.description}</p>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={laborType.is_system ? "secondary" : "default"}>
                  {laborType.is_system ? 'Sistema' : 'Organización'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(laborType.created_at), 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(laborType)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDuplicate(laborType)}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {!laborType.is_system && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(laborType)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      emptyState={
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay tipos de mano de obra</h3>
          <p className="text-muted-foreground mb-4">
            Comienza creando el primer tipo de mano de obra para el sistema.
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Tipo de Mano de Obra
          </Button>
        </div>
      }
    />
  )
}

export default AdminCostLabor