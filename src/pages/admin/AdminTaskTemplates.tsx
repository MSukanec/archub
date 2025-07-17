import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { NewTaskTemplateModal } from '@/modals/admin/NewTaskTemplateModal'
import { useTaskTemplatesAdmin, useDeleteTaskTemplate, type TaskTemplate } from '@/hooks/use-task-templates-admin'

import { Plus, Edit, Trash2, Settings, Eye, FileCode, Code, Calendar } from 'lucide-react'

export default function AdminTaskTemplates() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [searchValue, setSearchValue] = useState('')

  const { data: templates = [], isLoading } = useTaskTemplatesAdmin()
  const deleteTemplate = useDeleteTaskTemplate()

  // Filter and sort templates
  const filteredAndSortedTemplates = templates
    .filter(template => 
      template.code.toLowerCase().includes(searchValue.toLowerCase()) ||
      template.name_template.toLowerCase().includes(searchValue.toLowerCase()) ||
      template.task_categories?.name.toLowerCase().includes(searchValue.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name_template':
          return a.name_template.localeCompare(b.name_template)
        case 'code':
          return a.code.localeCompare(b.code)
        case 'category':
          return (a.task_categories?.name || '').localeCompare(b.task_categories?.name || '')
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const handleEdit = (template: TaskTemplate) => {
    setEditingTemplate(template)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTemplateId) return
    
    try {
      await deleteTemplate.mutateAsync(deleteTemplateId)
    } catch (error) {
      console.error('Error deleting template:', error)
    } finally {
      setDeleteTemplateId(null)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTemplate(null)
  }

  const handleViewParameters = (templateId: string) => {
    // TODO: Implement parameters modal/drawer
    toast({
      title: "Ver Parámetros",
      description: "Funcionalidad en desarrollo",
      variant: "default"
    })
  }

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('created_at')
  }

  // Statistics for cards
  const totalTemplates = templates.length
  const recentTemplates = templates.filter(template => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(template.created_at) >= weekAgo
  }).length

  const categoriesWithTemplates = new Set(templates.map(t => t.category_id)).size
  const templatesWithParameters = templates.filter(t => t.name_template.includes('{{')).length

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      width: '15%',
      render: (template: TaskTemplate) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs">
            {format(new Date(template.created_at), 'dd/MM/yyyy', { locale: es })}
          </span>
        </div>
      )
    },
    {
      key: 'code',
      label: 'Código',
      width: '10%',
      render: (template: TaskTemplate) => (
        <Badge variant="outline" className="font-mono">
          {template.code}
        </Badge>
      )
    },
    {
      key: 'name_template',
      label: 'Plantilla',
      width: '25%',
      render: (template: TaskTemplate) => (
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{template.name_template}</span>
        </div>
      )
    },
    {
      key: 'task_categories',
      label: 'Categoría',
      width: '20%',
      render: (template: TaskTemplate) => (
        <Badge variant="secondary">
          {template.task_categories?.name || 'Sin categoría'}
        </Badge>
      )
    },
    {
      key: 'code_prefix',
      label: 'Prefijo',
      width: '15%',
      render: (template: TaskTemplate) => (
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
            {template.code_prefix || template.code}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (template: TaskTemplate) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewParameters(template.id)}
            className="h-8 w-8 p-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(template)}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTemplateId(template.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  const customFilters = (
    <div className="space-y-3">
      <div>
        <Label htmlFor="sort" className="text-xs font-medium">
          Ordenar por
        </Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Fecha de creación</SelectItem>
            <SelectItem value="name_template">Plantilla</SelectItem>
            <SelectItem value="code">Código</SelectItem>
            <SelectItem value="category">Categoría</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <Layout
      headerProps={{
        title: "Plantillas de Tareas",
        showSearch: true,
        searchValue,
        onSearchChange: setSearchValue,
        customFilters,
        onClearFilters: clearFilters,
        actions: [
          <Button key="create" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Plantilla
          </Button>
        ]
      }}
      wide
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Plantillas</p>
                <p className="text-lg font-semibold">{totalTemplates}</p>
              </div>
              <FileCode className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Recientes</p>
                <p className="text-lg font-semibold">{recentTemplates}</p>
              </div>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Categorías</p>
                <p className="text-lg font-semibold">{categoriesWithTemplates}</p>
              </div>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Con Parámetros</p>
                <p className="text-lg font-semibold">{templatesWithParameters}</p>
              </div>
              <Code className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Table */}
        <Table
          data={filteredAndSortedTemplates}
          columns={columns}
          isLoading={isLoading}
        />
      </div>

      {/* Create/Edit Modal */}
      <NewTaskTemplateModal
        open={isModalOpen}
        onClose={handleCloseModal}
        template={editingTemplate || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta plantilla? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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