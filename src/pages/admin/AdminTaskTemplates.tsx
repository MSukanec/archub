import React, { useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Plus, FileCode, Edit, Copy, Trash2, Search, Settings, Eye } from 'lucide-react'
import { Table } from '@/components/ui-custom/Table'
import { useTaskTemplates } from '@/hooks/use-task-templates'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { HeaderDesktop } from '@/components/layout/desktop/HeaderDesktop'

type TabType = 'Lista' | 'Editor'

export default function AdminTaskTemplates() {
  const [activeTab, setActiveTab] = useState<TabType>('Lista')
  const [searchValue, setSearchValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  
  const { data: templates = [], isLoading } = useTaskTemplates()
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
          <div>
          </div>
        </div>
      )
    },
    {
      key: 'unit',
      label: 'Unidad',
      render: (template: any) => (
          {template.unit?.name || 'Sin unidad'}
        </Badge>
      )
    },
    {
      key: 'parameters',
      label: 'Parámetros',
      render: (template: any) => (
          {template.parameters?.length || 0} parámetros
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (template: any) => (
          {template.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (template: any) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTemplate(template)
              setActiveTab('Editor')
            }}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal('task-template', { template })}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // TODO: Implementar duplicar plantilla
              console.log('Duplicar plantilla:', template.id)
            }}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              openModal('delete-confirmation', {
                title: 'Eliminar Plantilla',
                description: '¿Estás seguro de que deseas eliminar esta plantilla de tarea?',
                itemName: template.name,
                onConfirm: () => {
                  // TODO: Implementar eliminación
                  console.log('Eliminar plantilla:', template.id)
                }
              })
            }}
          >
          </Button>
        </div>
      )
    }
  ]

  const headerProps = {
    title: 'Plantillas de Tareas',
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

  return (
    <Layout headerProps={headerProps} wide>
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
                title={searchValue ? "No se encontraron plantillas" : "No hay plantillas"}
                description={searchValue 
                  ? 'Prueba ajustando el término de búsqueda'
                  : 'Crea tu primera plantilla para comenzar a generar tareas paramétricas'
                }
                action={
                  !searchValue && (
                    <Button
                      onClick={() => openModal('task-template')}
                    >
                      Crear Primera Plantilla
                    </Button>
                  )
                }
              />
            }
          />
        )}
        
        {activeTab === 'Editor' && (
          <Card>
            <CardHeader>
                Editor de Plantilla
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                      Editor de plantilla en desarrollo...
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyState
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
    </Layout>
  )
}