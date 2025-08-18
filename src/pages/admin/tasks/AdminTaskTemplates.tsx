import React, { useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Plus, FileCode, Edit, Trash2, Search, Settings } from 'lucide-react'
import { Table } from '@/components/ui-custom/Table'
import { useTaskTemplates, useDeleteTaskTemplate } from '@/hooks/use-task-templates'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Header } from '@/components/layout/desktop/Header'

type TabType = 'Lista' | 'Editor'

const AdminTaskTemplates = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Lista')
  const [searchValue, setSearchValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  
  const { data: templates = [], isLoading } = useTaskTemplates()
  const deleteTaskTemplate = useDeleteTaskTemplate()
  const { openModal } = useGlobalModalStore()

  // Filtrar plantillas
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    template.slug.toLowerCase().includes(searchValue.toLowerCase())
  )

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      render: (template: any) => (
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div>
            <div className="font-medium text-sm">{template.name}</div>
            <div className="text-xs text-muted-foreground">{template.slug}</div>
          </div>
        </div>
      )
    },
    {
      key: 'unit',
      label: 'Unidad',
      render: (template: any) => (
        <Badge variant="outline" className="text-xs">
          {template.unit?.name || 'Sin unidad'}
        </Badge>
      )
    },
    {
      key: 'parameters',
      label: 'Parámetros',
      render: (template: any) => (
        <div className="text-sm text-muted-foreground">
          {template.parameters?.length || 0} parámetros
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (template: any) => (
        <Badge variant={template.is_active ? 'default' : 'secondary'} className="text-xs">
          {template.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (template: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => openModal('task-template', { template })}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => {
              openModal('delete-confirmation', {
                title: 'Eliminar Plantilla',
                description: '¿Estás seguro de que deseas eliminar esta plantilla de tarea?',
                itemName: template.name,
                onConfirm: () => {
                  console.log('Eliminar plantilla:', template.id)
                  deleteTaskTemplate.mutate(template.id)
                }
              })
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ]

  const headerProps = {
    title: 'Plantillas de Tareas',
    icon: FileCode,
    description: 'Gestión de plantillas de tareas paramétricas para generación automática',
    tabs: [
      { id: 'Lista', label: 'Lista', isActive: activeTab === 'Lista' },
      { id: 'Editor', label: 'Editor', isActive: activeTab === 'Editor' }
    ],
    activeTab,
    onTabChange: (tabId: string) => setActiveTab(tabId as TabType),
    actionButton: {
      label: 'Nueva Plantilla',
      icon: Plus,
      onClick: () => openModal('task-template')
    }
  }

  // Show full empty state when no templates exist
  if (!isLoading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <EmptyState
          icon={<FileCode className="w-12 h-12 text-muted-foreground" />}
          title="No hay plantillas"
          description="Crea tu primera plantilla para comenzar a generar tareas paramétricas"
          action={
            <Button
              onClick={() => openModal('task-template')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear Primera Plantilla
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {activeTab === 'Lista' && (
        <Table
          data={filteredTemplates}
          columns={columns}
          isLoading={isLoading}
          topBar={{
            showSearch: true,
            searchValue: searchValue,
            onSearchChange: setSearchValue
          }}
          emptyState={
            <EmptyState
              icon={<FileCode className="w-12 h-12 text-muted-foreground" />}
              title="No se encontraron plantillas"
              description="Prueba ajustando el término de búsqueda"
            />
          }
        />
      )}
      
      {activeTab === 'Editor' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Editor de Plantilla
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium">Editando: {selectedTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Editor de plantilla en desarrollo...
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Settings className="w-12 h-12 text-muted-foreground" />}
                title="Selecciona una plantilla"
                description="Elige una plantilla de la lista para comenzar a editarla"
                action={
                  <Button
                    onClick={() => setActiveTab('Lista')}
                    variant="outline"
                  >
                    Ir a Lista
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AdminTaskTemplates;