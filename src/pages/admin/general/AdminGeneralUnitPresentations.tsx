import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Table } from '@/components/ui-custom/Table'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useUnitPresentations, useDeleteUnitPresentation, type UnitPresentation } from '@/hooks/use-unit-presentations'
import { useCurrentUser } from '@/hooks/use-current-user'

import { Edit, Trash2, Target, Zap, Package, Clock } from 'lucide-react'
import { exportToExcel, createExportColumns } from '@/lib/export-utils'

const AdminGeneralUnitPresentations = () => {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'user'>('all')

  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()

  // Real data from useUnitPresentations hook
  const { data: unitPresentations = [], isLoading } = useUnitPresentations()
  const deleteUnitPresentationMutation = useDeleteUnitPresentation()

  // Filter and sort unit presentations
  const filteredUnitPresentations = unitPresentations
    .filter((unitPresentation: UnitPresentation) => {
      // Search filter - search in unit presentation name
      const matchesSearch = !searchValue || 
        unitPresentation.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        unitPresentation.slug?.toLowerCase().includes(searchValue.toLowerCase())
      
      // Type filter
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'system' && unitPresentation.is_system) ||
        (typeFilter === 'user' && !unitPresentation.is_system)
      
      return matchesSearch && matchesType
    })
    .sort((a: UnitPresentation, b: UnitPresentation) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '')
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleEdit = (unitPresentation: UnitPresentation) => {
    console.log('📝 Editando unidad de presentación:', unitPresentation);
    const modalData = { unitPresentation: unitPresentation, isEditing: true };
    openModal('unit-presentation', modalData)
  }

  const handleDelete = (unitPresentation: UnitPresentation) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Unidad de Presentación',
      description: `Para confirmar la eliminación, escribe el nombre exacto de la unidad de presentación.`,
      itemName: unitPresentation.name,
      itemType: 'unidad de presentación',
      destructiveActionText: 'Eliminar Unidad de Presentación',
      onConfirm: () => deleteUnitPresentationMutation.mutate(unitPresentation.id),
      mode: 'dangerous'
    })
  }

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('created_at')
    setTypeFilter('all')
  }

  const handleExport = () => {
    console.log('🔄 Exportando unidades de presentación...')
    const columns = createExportColumns([
      { key: 'name', label: 'Nombre' },
      { key: 'slug', label: 'Slug' },
      { key: 'is_system', label: 'Es Sistema', transform: (value) => value ? 'Sí' : 'No' },
      { key: 'created_at', label: 'Fecha de Creación', transform: (value) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: es }) }
    ])
    
    exportToExcel(filteredUnitPresentations, columns, 'unidades-presentacion')
  }

  // Table columns configuration
  const columns = [
    { 
      key: 'name', 
      label: 'Nombre', 
      width: 'minmax(0, 1fr)',
      render: (unitPresentation: UnitPresentation) => (
        <div>
          <div className="font-medium">
            {unitPresentation.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {unitPresentation.slug}
          </div>
        </div>
      )
    },
    { 
      key: 'is_system', 
      label: 'Tipo', 
      width: '10%',
      render: (unitPresentation: UnitPresentation) => (
        <div>
          {unitPresentation.is_system ? (
            <Badge variant="secondary" className="text-xs">
              Sistema
            </Badge>
          ) : (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
              Usuario
            </Badge>
          )}
        </div>
      )
    },
    { 
      key: 'created_at', 
      label: 'Fecha', 
      width: '10%',
      render: (unitPresentation: UnitPresentation) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(unitPresentation.created_at), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    },
    { 
      key: 'actions', 
      label: 'Acciones', 
      width: '10%',
      render: (unitPresentation: UnitPresentation) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(unitPresentation)}
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
            title="Editar unidad de presentación"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {!unitPresentation.is_system && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(unitPresentation)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Eliminar unidad de presentación"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  const features = [
    {
      icon: <Package className="w-5 h-5" />,
      title: "Gestión de Unidades",
      description: "Administra las diferentes unidades de presentación utilizadas en el sistema para la comercialización de productos."
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Sistema de Slugs",
      description: "Identificadores únicos que facilitan la integración con otros sistemas y la organización interna."
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Unidades del Sistema",
      description: "Unidades predefinidas que garantizan la consistencia y estabilidad del sistema de presentación."
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Seguimiento Temporal",
      description: "Monitorea la creación y modificación de unidades con registros temporales completos para auditoría."
    }
  ]

  return (
    <div className="space-y-6">
      <Table
        data={filteredUnitPresentations}
        columns={columns}
        isLoading={isLoading}
        topBar={{
          showSearch: true,
          searchValue: searchValue,
          onSearchChange: setSearchValue,
          showFilter: true,
          isFilterActive: typeFilter !== 'all' || sortBy !== 'created_at',
          renderFilterContent: () => (
            <div className="space-y-3 p-2 min-w-[200px]">
              <div>
                <Label className="text-xs font-medium mb-1 block">Tipo</Label>
                <Select value={typeFilter} onValueChange={(value: 'all' | 'system' | 'user') => setTypeFilter(value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas las unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las unidades</SelectItem>
                    <SelectItem value="system">Unidades del sistema</SelectItem>
                    <SelectItem value="user">Unidades de usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Ordenar por</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Fecha de creación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Fecha de creación</SelectItem>
                    <SelectItem value="name">Nombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ),
          showClearFilters: typeFilter !== 'all' || sortBy !== 'created_at',
          onClearFilters: clearFilters,
          showExport: true,
          onExport: handleExport,
          showFeatures: true,
          features: features
        }}
        emptyState={
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-muted-foreground">No hay unidades de presentación</h3>
            <p className="text-sm text-muted-foreground mt-1">Crea tu primera unidad de presentación para comenzar a organizar productos.</p>
          </div>
        }
      />
    </div>
  )
}

export default AdminGeneralUnitPresentations;