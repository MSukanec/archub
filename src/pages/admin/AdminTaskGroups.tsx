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
            // Get template basic info
            const { data: template } = await supabase
              .from('task_templates')
              .select('*')
              .eq('id', group.template_id)
              .single()

            if (template) {
              // Load parameter options for this group with parameter details
              const { data: groupOptions } = await supabase
                .from('task_group_parameter_options')
                .select(`
                  parameter_id,
                  parameter_option_id,
                  task_parameter_values!inner(id, name, label),
                  task_parameters!inner(id, name, label, type, expression_template)
                `)
                .eq('group_id', group.id)

              // Create options map and parameters list
              const optionsMap: Record<string, any[]> = {}
              const parametersMap: Record<string, any> = {}
              
              if (groupOptions) {
                groupOptions.forEach(opt => {
                  // Build options map
                  if (!optionsMap[opt.parameter_id]) {
                    optionsMap[opt.parameter_id] = []
                  }
                  optionsMap[opt.parameter_id].push(opt.task_parameter_values)
                  
                  // Build parameters map
                  parametersMap[opt.parameter_id] = opt.task_parameters
                })
              }

              // Convert parameters map to array for compatibility
              const parameters = Object.entries(parametersMap).map(([paramId, param]) => ({
                parameter_id: paramId,
                task_parameter: param
              }))

              const preview = generateProcessedTemplatePreview(template.name_template, parameters, optionsMap)
              
              templateInfoMap[group.id] = {
                hasTemplate: true,
                parameters: parameters.map((tp: any) => ({
                  id: tp.parameter_id,
                  name: tp.task_parameter?.name || 'unknown',
                  label: tp.task_parameter?.label || 'Unknown Parameter',
                  type: tp.task_parameter?.type || 'unknown',
                  position: 1
                })),
                preview
              }
            } else {
              templateInfoMap[group.id] = { hasTemplate: false }
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

  // Generate processed template preview with real values
  const generateProcessedTemplatePreview = (nameTemplate: string, parameters: any[], optionsMap: Record<string, any[]>) => {
    let processedTemplate = nameTemplate

    parameters.forEach((tp) => {
      const parameter = tp.task_parameter
      if (!parameter) return

      const placeholder = `{{${parameter.slug}}}`
      const selectedOptions = optionsMap[tp.parameter_id] || []
      
      if (selectedOptions.length > 0) {
        // Get the first selected option
        const selectedOption = selectedOptions[0]
        
        // Apply expression_template or use {value} as fallback
        const expressionTemplate = parameter.expression_template || '{value}'
        const generatedText = expressionTemplate.replace('{value}', selectedOption.label)
        
        processedTemplate = processedTemplate.replace(placeholder, generatedText)
      } else {
        // No options selected, show parameter label in brackets
        processedTemplate = processedTemplate.replace(placeholder, `[${parameter.label}]`)
      }
    })

    // Clean up extra spaces
    processedTemplate = processedTemplate.replace(/\s+/g, ' ').trim()
    
    return processedTemplate
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
        <div className="space-y-1">
          <div className="font-medium text-sm">{taskGroup.name}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {taskGroup.code || 'Sin código'}
          </div>
        </div>
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