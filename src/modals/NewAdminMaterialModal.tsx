import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Unit {
  id: string
  name: string
}

interface MaterialCategory {
  id: string
  name: string
}

interface Material {
  id: string
  name: string
  unit_id: string
  cost: number
  category_id: string
  created_at: string
  unit?: { name: string }
  category?: { name: string }
}

interface NewAdminMaterialModalProps {
  open: boolean
  onClose: () => void
  material?: Material | null
}

export function NewAdminMaterialModal({ open, onClose, material }: NewAdminMaterialModalProps) {
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [unitId, setUnitId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const queryClient = useQueryClient()

  // Load units
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('units')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      return data as Unit[]
    }
  })

  // Load material categories
  const { data: categories = [] } = useQuery({
    queryKey: ['material-categories'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('material_categories')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      return data as MaterialCategory[]
    }
  })

  // Create/Update material mutation
  const saveMaterialMutation = useMutation({
    mutationFn: async (materialData: { name: string; cost: number; unit_id: string; category_id: string }) => {
      if (!supabase) throw new Error('Supabase not initialized')

      if (material) {
        // Update existing material
        const { data, error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', material.id)
          .select()
          .single()
        
        if (error) throw error
        return data
      } else {
        // Create new material
        const { data, error } = await supabase
          .from('materials')
          .insert(materialData)
          .select()
          .single()
        
        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast({
        title: material ? 'Material actualizado' : 'Material creado',
        description: material 
          ? 'El material ha sido actualizado correctamente.'
          : 'El nuevo material ha sido creado correctamente.'
      })
      handleClose()
    },
    onError: (error) => {
      console.error('Error saving material:', error)
      toast({
        title: 'Error',
        description: 'Hubo un problema al guardar el material.',
        variant: 'destructive'
      })
    }
  })

  // Load material data when editing
  useEffect(() => {
    if (material) {
      setName(material.name || '')
      setCost(material.cost?.toString() || '')
      setUnitId(material.unit_id || '')
      setCategoryId(material.category_id || '')
    } else {
      // Reset form for new material
      setName('')
      setCost('')
      setUnitId('')
      setCategoryId('')
    }
  }, [material, open])

  const handleClose = () => {
    setName('')
    setCost('')
    setUnitId('')
    setCategoryId('')
    onClose()
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del material es requerido.',
        variant: 'destructive'
      })
      return
    }

    if (!unitId) {
      toast({
        title: 'Error',
        description: 'La unidad es requerida.',
        variant: 'destructive'
      })
      return
    }

    if (!categoryId) {
      toast({
        title: 'Error',
        description: 'La categoría es requerida.',
        variant: 'destructive'
      })
      return
    }

    const costValue = parseFloat(cost) || 0

    saveMaterialMutation.mutate({
      name: name.trim(),
      cost: costValue,
      unit_id: unitId,
      category_id: categoryId
    })
  }

  return (
    <CustomModal open={open} onClose={handleClose}>
      {{
        header: {
          title: material ? 'Editar Material' : 'Nuevo Material',
          description: material 
            ? 'Actualiza la información del material.'
            : 'Crea un nuevo material para el sistema.'
        },
        body: (
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
                  {units.map((unit) => (
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
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ),
        footer: (
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={saveMaterialMutation.isPending}
            >
              {saveMaterialMutation.isPending ? 'Guardando...' : (material ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        )
      }}
    </CustomModal>
  )
}