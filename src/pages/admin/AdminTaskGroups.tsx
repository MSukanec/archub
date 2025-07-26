import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useTaskGroups, useDeleteTaskGroup } from '@/hooks/use-task-groups'

import { Plus, Edit, Trash2, Package2, Target, Zap, Eye, Clock, Grid3x3 } from 'lucide-react'

interface TaskGroup {
  id: string
  name: string
  category_id: string
  template_id: string
  created_at: string
  updated_at: string
}

export default function AdminTaskGroups() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [groupingType, setGroupingType] = useState<'none' | 'subcategory'>('none')
  const { openModal } = useGlobalModalStore()
  
  // Real data from useTaskGroups hook
  const { data: taskGroups = [], isLoading } = useTaskGroups()
  const deleteTaskGroupMutation = useDeleteTaskGroup()

  // Statistics calculations
  const totalTaskGroups = taskGroups.length
  const recentTaskGroups = taskGroups.filter((group: TaskGroup) => {
    const groupDate = new Date(group.created_at)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return groupDate >= sevenDaysAgo
  }).length

  // Filter and sort task groups
  const filteredTaskGroups = taskGroups
    .filter((group: TaskGroup) => {
      // Search filter
      return group.name?.toLowerCase().includes(searchValue.toLowerCase())
    })
    .sort((a: TaskGroup, b: TaskGroup) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'created_at') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      return 0
    })

  // Group by subcategory if needed
  const groupedData = useMemo(() => {
    if (groupingType === 'subcategory') {
      const grouped = filteredTaskGroups.reduce((acc: Record<string, TaskGroup[]>, group: TaskGroup) => {
        const subcategoryName = group.task_categories?.task_subcategories?.name || 'Sin subcategoría'
        if (!acc[subcategoryName]) {
          acc[subcategoryName] = []
        }
        acc[subcategoryName].push(group)
        return acc
      }, {})
      return grouped
    }
    return null
  }, [filteredTaskGroups, groupingType])

  // Handle delete task group
  const handleDeleteTaskGroup = (taskGroup: TaskGroup) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Grupo de Tareas',
      description: 'Esta acción no se puede deshacer. Se eliminará el grupo de tareas y todas sus plantillas asociadas.',
      itemName: taskGroup.name,
      onConfirm: () => {
        deleteTaskGroupMutation.mutate(taskGroup.id);
      }
    });
  }

  // Handle edit task group
  const handleEditTaskGroup = (taskGroup: TaskGroup) => {
    openModal('task-group', { taskGroup });
  }

  // Custom filters for ActionBar
  const renderCustomFilters = () => (
    <div className="flex items-center gap-2">
      {/* Grouping dropdown */}
      <select
        value={groupingType}
        onChange={(e) => setGroupingType(e.target.value as 'none' | 'subcategory')}
        className="h-8 px-2 rounded border text-sm bg-background"
      >
        <option value="none">Sin agrupar</option>
        <option value="subcategory">Agrupar por Subcategoría</option>
      </select>
      
      {/* Sort dropdown */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="h-8 px-2 rounded border text-sm bg-background"
      >
        <option value="name">Ordenar por Nombre</option>
        <option value="created_at">Ordenar por Fecha</option>
      </select>
    </div>
  )

  // Features for ActionBar expansion
  const features = [
    {
      icon: <Package2 className="w-5 h-5" />,
      title: "Gestión Centralizada de Grupos",
      description: "Administra todos los grupos de tareas de forma independiente sin depender de las categorías."
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Organización Avanzada",
      description: "Crea y organiza grupos de tareas para facilitar la gestión de plantillas y elementos relacionados."
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "Vista Simplificada",
      description: "Visualiza todos los grupos en una tabla simple con información clave como nombre y fechas de creación."
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Operaciones Rápidas",
      description: "Edita, elimina y gestiona grupos de tareas con acciones rápidas desde la interfaz principal."
    }
  ]

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'Nombre del Grupo',
      width: '40%',
      render: (taskGroup: TaskGroup) => (
        <div className="font-medium text-sm">{taskGroup.name}</div>
      )
    },
    {
      key: 'template_id',
      label: 'Plantilla Asociada',
      width: '25%',
      render: (taskGroup: TaskGroup) => (
        <div className="text-sm">
          {taskGroup.template_id ? (
            <Badge variant="secondary" className="text-xs">
              Con Plantilla
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Sin Plantilla
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      width: '20%',
      render: (taskGroup: TaskGroup) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(taskGroup.created_at), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '15%',
      render: (taskGroup: TaskGroup) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => handleEditTaskGroup(taskGroup)}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => handleDeleteTaskGroup(taskGroup)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )
    }
  ]

  if (isLoading) {
    return (
      <Layout wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando grupos de tareas...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout wide={true}>
      <ActionBarDesktop
        title="Grupos de Tareas"
        icon={<Package2 className="w-5 h-5" />}
        features={features}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        customFilters={renderCustomFilters()}
        showProjectSelector={false}
        customActions={[
          <Button
            key="grouping"
            variant="ghost"
            size="sm"
            onClick={() => setGroupingType(groupingType === 'none' ? 'subcategory' : 'none')}
            title="Agrupar por Subcategoría"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
        ]}
        primaryActionLabel="Nuevo Grupo"
        onPrimaryActionClick={() => openModal('task-group-creator', {})}
      />
      
      <div className="space-y-6">
        {filteredTaskGroups.length === 0 ? (
          <EmptyState
            icon={<Package2 className="w-12 h-12 text-muted-foreground" />}
            title={searchValue ? "No se encontraron grupos" : "No hay grupos de tareas creados"}
            description={searchValue 
              ? 'Prueba ajustando los filtros de búsqueda' 
              : 'Comienza creando tu primer grupo de tareas para organizar plantillas y elementos relacionados'
            }
          />
        ) : groupingType === 'subcategory' && groupedData ? (
          <div className="space-y-6">
            {Object.entries(groupedData).map(([subcategoryName, groups]) => (
              <div key={subcategoryName} className="space-y-3">
                <div className="flex items-center gap-3 py-2 px-4 bg-accent/30 rounded-lg border">
                  <Package2 className="w-4 h-4 text-accent-foreground" />
                  <span className="font-medium text-sm text-accent-foreground">
                    {subcategoryName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({groups.length} {groups.length === 1 ? 'grupo' : 'grupos'})
                  </span>
                </div>
                <Table
                  data={groups}
                  columns={columns}
                />
              </div>
            ))}
          </div>
        ) : (
          <Table
            data={filteredTaskGroups}
            columns={columns}
          />
        )}
      </div>
    </Layout>
  )
}