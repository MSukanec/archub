import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useUnitPresentations, UnitPresentation, useDeleteUnitPresentation } from '@/hooks/use-unit-presentations'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'

import { Plus, Edit, Trash2, Ruler, Package } from 'lucide-react'

export default function AdminUnitPresentations() {
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
          {format(new Date(unitPresentation.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Presentación',
      render: (unitPresentation: UnitPresentation) => (
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
          {unitPresentation.unit?.name || 'Sin unidad'}
        </Badge>
      )
    },
    {
      key: 'equivalence',
      label: 'Equivalencia',
      render: (unitPresentation: UnitPresentation) => (
          {unitPresentation.equivalence}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (unitPresentation: UnitPresentation) => (
          {unitPresentation.description || '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (unitPresentation: UnitPresentation) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(unitPresentation)}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(unitPresentation)}
          >
          </Button>
        </div>
      )
    }
  ]

  // Custom filters component
  const customFilters = (
        <Select value={filterByUnit} onValueChange={setFilterByUnit}>
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
      
        <Select value={sortBy} onValueChange={setSortBy}>
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
  )

  const headerProps = {
    title: 'Unidades',
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: clearFilters,
    actionButton: {
      label: "Nueva Unidad",
      icon: Plus,
      onClick: handleCreate
    }
  }

  return (
    <Layout wide headerProps={headerProps}>
        {/* Unit Presentations Table */}
        <Table
          data={sortedUnitPresentations}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            </div>
          }
        />
      </div>
    </Layout>
  )
}