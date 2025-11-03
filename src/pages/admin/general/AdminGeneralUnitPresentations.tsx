import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useUnitPresentations, UnitPresentation, useDeleteUnitPresentation } from '@/hooks/use-unit-presentations'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import AdminUnitRow from '@/components/ui/data-row/rows/AdminUnitRow'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import { Table } from '@/components/ui-custom/tables-and-trees/Table'

import { Plus, Edit, Trash2, Ruler, Package } from 'lucide-react'

const AdminGeneralUnitPresentations = () => {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [filterByUnit, setFilterByUnit] = useState('')
  
  const { openModal } = useGlobalModalStore()

  // Fetch unit presentations using the hook
  const { data: unitPresentations = [], isLoading } = useUnitPresentations()
  const deleteUnitPresentationMutation = useDeleteUnitPresentation()

  // Get unique units for filters
  const uniqueUnits = unitPresentations
    .filter(up => up.unit)
    .reduce((acc: any[], unitPresentation) => {
      if (!acc.find(u => u.id === unitPresentation.unit?.id)) {
        acc.push(unitPresentation.unit)
      }
      return acc
    }, [])

  // Apply client-side filtering
  const filteredUnitPresentations = unitPresentations.filter(unitPresentation => {
    const matchesSearch = searchValue === '' || 
      unitPresentation.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      unitPresentation.unit?.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      unitPresentation.description?.toLowerCase().includes(searchValue.toLowerCase())
    
    const matchesUnit = filterByUnit === '' || unitPresentation.unit_id === filterByUnit
    
    return matchesSearch && matchesUnit
  })

  // Apply client-side sorting
  const sortedUnitPresentations = [...filteredUnitPresentations].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    } else if (sortBy === 'unit') {
      return (a.unit?.name || '').localeCompare(b.unit?.name || '')
    } else if (sortBy === 'equivalence') {
      return a.equivalence - b.equivalence
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const handleEdit = (unitPresentation: UnitPresentation) => {
    openModal('unit-presentation-form', { editingUnitPresentation: unitPresentation })
  }

  const handleCreate = () => {
    openModal('unit-presentation-form', { editingUnitPresentation: null })
  }

  const handleDelete = (unitPresentation: UnitPresentation) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Unidad',
      description: `¿Estás seguro que deseas eliminar la unidad "${unitPresentation.name}"? Esta acción no se puede deshacer.`,
      itemName: unitPresentation.name,
      destructiveActionText: 'Eliminar Unidad',
      onDelete: () => deleteUnitPresentationMutation.mutate(unitPresentation.id),
      isLoading: deleteUnitPresentationMutation.isPending
    })
  }

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('name')
    setFilterByUnit('')
  }

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      width: '5%',
      render: (unitPresentation: UnitPresentation) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(unitPresentation.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Presentación',
      render: (unitPresentation: UnitPresentation) => (
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">{unitPresentation.name}</span>
            <span className="text-xs text-muted-foreground">
              {unitPresentation.equivalence} {unitPresentation.unit?.name}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'unit',
      label: 'Unidad Base',
      render: (unitPresentation: UnitPresentation) => (
        <Badge variant="secondary" className="text-xs">
          <Package className="h-3 w-3 mr-1" />
          {unitPresentation.unit?.name || 'Sin unidad'}
        </Badge>
      )
    },
    {
      key: 'equivalence',
      label: 'Equivalencia',
      render: (unitPresentation: UnitPresentation) => (
        <span className="text-sm font-medium">
          {unitPresentation.equivalence}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (unitPresentation: UnitPresentation) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          {unitPresentation.description || '-'}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Unit Presentations Table */}
      <Table
        data={sortedUnitPresentations}
        columns={columns}
        isLoading={isLoading}
        rowActions={(unitPresentation: UnitPresentation) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(unitPresentation)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(unitPresentation),
            variant: 'destructive' as const
          }
        ]}
        renderCard={(unitPresentation) => (
          <AdminUnitRow
            unitPresentation={unitPresentation}
            onClick={() => handleEdit(unitPresentation)}
            density="normal"
          />
        )}
        topBar={{
          showSearch: true,
          searchValue: searchValue,
          onSearchChange: setSearchValue,
          showFilter: true,
          isFilterActive: filterByUnit !== '' || sortBy !== 'name',
          renderFilterContent: () => (
            <div className="space-y-3 p-2 min-w-[200px]">
              <div>
                <Label className="text-xs font-medium mb-1 block">Unidad Base</Label>
                <Select value={filterByUnit} onValueChange={setFilterByUnit}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas las unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las unidades</SelectItem>
                    {uniqueUnits.map((unit: any) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs font-medium mb-1 block">Ordenar por</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="unit">Unidad Base</SelectItem>
                    <SelectItem value="equivalence">Equivalencia</SelectItem>
                    <SelectItem value="created_at">Fecha de creación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ),
          onClearFilters: clearFilters
        }}
        emptyState={
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-muted-foreground">No hay unidades</h3>
            <p className="text-sm text-muted-foreground mt-1">No hay unidades de presentación que coincidan con los filtros seleccionados.</p>
          </div>
        }
      />
    </div>
  )
}

export default AdminGeneralUnitPresentations;