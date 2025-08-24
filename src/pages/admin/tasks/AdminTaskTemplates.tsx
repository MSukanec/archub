import React, { useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Plus, FileCode, Edit, Trash2, Search, Settings } from 'lucide-react'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { TableTopBar } from '@/components/ui-custom/tables-and-trees/TableTopBar'
import { useTaskTemplates, useDeleteTaskTemplate } from '@/hooks/use-task-templates'
import { useTaskCategories } from '@/hooks/use-task-categories'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Header } from '@/components/layout/desktop/Header'

type TabType = 'Lista' | 'Editor'

const AdminTaskTemplates = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Lista')
  const [searchValue, setSearchValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [groupBy, setGroupBy] = useState<'none' | 'category'>('category')
  
  const { data: templates = [], isLoading } = useTaskTemplates()
  const { data: allCategories = [] } = useTaskCategories()
  const deleteTaskTemplate = useDeleteTaskTemplate()
  const { openModal } = useGlobalModalStore()

  // Filtrar plantillas
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    template.slug.toLowerCase().includes(searchValue.toLowerCase())
  )

  // Función para obtener la categoría padre
  const getParentCategory = (categoryId: string) => {
    const category = allCategories.find(cat => cat.id === categoryId)
    if (!category) return null
    
    // Si no tiene parent_id, es una categoría padre
    if (!category.parent_id) return category
    
    // Si tiene parent_id, buscar la categoría padre recursivamente
    let parentCategory = allCategories.find(cat => cat.id === category.parent_id)
    while (parentCategory && parentCategory.parent_id) {
      parentCategory = allCategories.find(cat => cat.id === parentCategory.parent_id)
    }
    return parentCategory
  }

  // Agrupar plantillas por categoría padre si está habilitado
  const groupedTemplates = groupBy === 'category' 
    ? filteredTemplates.reduce((groups, template) => {
        const parentCategory = getParentCategory(template.task_category_id)
        const groupName = parentCategory ? parentCategory.name : 'Sin categoría'
        
        if (!groups[groupName]) {
          groups[groupName] = []
        }
        groups[groupName].push(template)
        return groups
      }, {} as Record<string, typeof filteredTemplates>)
    : { 'Todas las plantillas': filteredTemplates }

  const columns = [
    {
      key: 'category',
      label: 'Categoría',
      className: 'w-1/4',
      render: (template: any) => {
        const category = allCategories.find(cat => cat.id === template.task_category_id)
        const parentCategory = getParentCategory(template.task_category_id)
        
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {category?.name || 'Sin categoría'}
            </div>
            {parentCategory && parentCategory.id !== category?.id && (
              <div className="text-xs text-muted-foreground">
                {parentCategory.name}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'name',
      label: 'Nombre',
      className: 'w-1/4',
      render: (template: any) => (
        <div>
          <div className="font-medium text-sm">{template.name}</div>
          <div className="text-xs text-muted-foreground">{template.slug}</div>
        </div>
      )
    },
    {
      key: 'unit',
      label: 'Unidad',
      className: 'w-1/4',
      render: (template: any) => (
        <Badge variant="outline" className="text-xs">
          {template.unit?.name || 'Sin unidad'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'w-1/4',
      render: (template: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className=" hover:bg-[var(--button-ghost-hover-bg)]"
            onClick={() => openModal('task-template', { template })}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className=" hover:bg-[var(--button-ghost-hover-bg)]"
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
            <Trash2 className="w-4 h-4 text-red-500" />
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
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <EmptyState
              icon={<FileCode className="w-12 h-12 text-muted-foreground" />}
              title="No se encontraron plantillas"
              description="Prueba ajustando el término de búsqueda"
            />
          ) : (
            <Table
              data={filteredTemplates}
              columns={columns}
              isLoading={false}
              className="min-w-full"
              topBar={{
                tabs: [groupBy === 'none' ? 'Sin Agrupar' : 'Por Categorías'],
                activeTab: groupBy === 'none' ? 'Sin Agrupar' : 'Por Categorías',
                onTabChange: (tab) => setGroupBy(tab === 'Sin Agrupar' ? 'none' : 'category'),
                showSearch: true,
                searchValue: searchValue,
                onSearchChange: setSearchValue,
                showSort: true,
                renderSortContent: () => (
                  <div className="p-3 space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setGroupBy('none')}
                    >
                      Sin Agrupar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setGroupBy('category')}
                    >
                      Por Categorías
                    </Button>
                  </div>
                ),
                isSortActive: true
              }}
            />
          )}
        </>
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