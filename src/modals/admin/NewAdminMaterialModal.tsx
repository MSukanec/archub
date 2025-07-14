import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomModalLayout } from '@/components/modal/legacy/CustomModalLayout'
import { CustomModalHeader } from '@/components/modal/legacy/CustomModalHeader'
import { CustomModalBody } from '@/components/modal/legacy/CustomModalBody'
import { CustomModalFooter } from '@/components/modal/legacy/CustomModalFooter'

interface Material {
  id: string
  name: string
  cost: number
  unit_id: string
  category_id: string
  created_at: string
  unit?: {
    name: string
  }
  category?: {
    name: string
  }
}

interface NewAdminMaterialModalProps {
  open: boolean
  onClose: () => void
  editingMaterial?: Material | null
  onSave: (material: any) => void
}

const PREDEFINED_UNITS = [
  { id: 'kg', name: 'Kilogramos' },
  { id: 'm', name: 'Metros' },
  { id: 'm2', name: 'Metros cuadrados' },
  { id: 'm3', name: 'Metros cúbicos' },
  { id: 'unidad', name: 'Unidades' },
  { id: 'litro', name: 'Litros' },
  { id: 'ton', name: 'Toneladas' }
]

const PREDEFINED_CATEGORIES = [
  { id: 'construccion', name: 'Construcción' },
  { id: 'acabados', name: 'Acabados' },
  { id: 'estructura', name: 'Estructura' },
  { id: 'instalaciones', name: 'Instalaciones' },
  { id: 'herramientas', name: 'Herramientas' }
]

export function NewAdminMaterialModal({ open, onClose, editingMaterial, onSave }: NewAdminMaterialModalProps) {
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [unitId, setUnitId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (editingMaterial) {
      setName(editingMaterial.name || '')
      setCost(editingMaterial.cost?.toString() || '')
      setUnitId(editingMaterial.unit_id || '')
      setCategoryId(editingMaterial.category_id || '')
    } else {
      setName('')
      setCost('')
      setUnitId('')
      setCategoryId('')
    }
  }, [editingMaterial, open])

  const handleSave = async () => {
    if (!name.trim() || !unitId || !categoryId) {
      return
    }

    setIsLoading(true)
    try {
      const materialData = {
        name: name.trim(),
        cost: cost ? parseFloat(cost) : 0,
        unit_id: unitId,
        category_id: categoryId
      }

      await onSave(materialData)
      handleClose()
    } catch (error) {
      console.error('Error saving material:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setCost('')
    setUnitId('')
    setCategoryId('')
    onClose()
  }

  if (!open) return null

  return (
    <CustomModalLayout
      open={open}
      onClose={handleClose}
    >
      {{
        header: (
          <CustomModalHeader
            title={editingMaterial ? 'Editar Material' : 'Nuevo Material'}
            description="Completa la información del material"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium required-asterisk">
                  Nombre del Material
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Cemento Portland"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost" className="text-xs font-medium">
                  Costo
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit" className="text-xs font-medium required-asterisk">
                  Unidad
                </Label>
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecciona una unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_UNITS.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-medium required-asterisk">
                  Categoría
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={handleSave}
            saveText={editingMaterial ? 'Guardar cambios' : 'Crear material'}
            saveDisabled={!name.trim() || !unitId || !categoryId || isLoading}
            isLoading={isLoading}
          />
        )
      }}
    </CustomModalLayout>
  )
}