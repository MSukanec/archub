import { useState, useEffect } from 'react'
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
import { supabase } from '@/lib/supabase'

import { Plus, Edit, Trash2, Package2, Target, Zap, Eye, Clock } from 'lucide-react'

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
  const [templateInfo, setTemplateInfo] = useState<Record<string, any>>({})
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
    openModal('task-group-creator', { taskGroup });
  }

  // Load template information for each task group
  useEffect(() => {
    const loadTemplateInfo = async () => {
      if (!supabase || taskGroups.length === 0) return

      const templateInfoMap: Record<string, any> = {}

      for (const group of taskGroups) {
        if (group.template_id) {
          try {
            // Get template parameters
            const { data: templateParams } = await supabase
              .from('task_template_parameters')
              .select(`
                *,
                task_parameter:task_parameters(name)
              `)
              .eq('template_id', group.template_id)
              .order('position')

            templateInfoMap[group.id] = {
              hasTemplate: true,
              parameters: templateParams || [],
              preview: generateTemplatePreview(group.name, templateParams || [])
            }
          } catch (error) {
            console.error('Error loading template info:', error)
            templateInfoMap[group.id] = { hasTemplate: false }
          }
        } else {
          templateInfoMap[group.id] = { hasTemplate: false }
        }
      }

      setTemplateInfo(templateInfoMap)
    }

    loadTemplateInfo()
  }, [taskGroups])

  // Generate template preview
  const generateTemplatePreview = (groupName: string, parameters: any[]) => {
    if (parameters.length === 0) {
      return `${groupName}.`
    }

    const parameterPlaceholders = parameters
      .map(tp => `{{${tp.task_parameter?.name || 'parámetro'}}}`)
      .join(' ')

    return `${groupName} ${parameterPlaceholders}.`
  }



  // Custom filters for ActionBar
  const renderCustomFilters = () => (
    <div className="flex items-center gap-2">
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
      label: 'Grupo de Tareas',
      width: '35%',
      render: (taskGroup: TaskGroup) => (
        <div className="font-medium text-sm">{taskGroup.name}</div>
      )
    },
    {
      key: 'template_info',
      label: 'Plantilla de Tareas',
      width: '35%',
      render: (taskGroup: TaskGroup) => {
        const info = templateInfo[taskGroup.id]
        
        if (!info || !info.hasTemplate) {
          return (
            <div className="text-sm text-muted-foreground">
              Sin plantilla configurada
            </div>
          )
        }

        return (
          <div className="text-sm space-y-1">
            <div className="font-medium">{info.preview}</div>
            <div className="text-xs text-muted-foreground">
              {info.parameters.length} parámetro{info.parameters.length !== 1 ? 's' : ''} configurado{info.parameters.length !== 1 ? 's' : ''}
            </div>
          </div>
        )
      }
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
      width: '10%',
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