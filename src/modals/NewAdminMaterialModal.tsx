import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Material {
  id: string
  name: string
  unit_id: string
  cost: number
  category_id: string
  created_at: string
}

interface NewAdminMaterialModalProps {
  open: boolean
  onClose: () => void
  material?: Material | null
}

export function NewAdminMaterialModal({ open, onClose, material }: NewAdminMaterialModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    unit_id: '',
    cost: '',
    category_id: ''
  })

  const queryClient = useQueryClient()

  // Reset form when modal opens/closes or material changes
  useEffect(() => {
    if (open) {
      if (material) {
        // Editing existing material
        setFormData({
          name: material.name || '',
          unit_id: material.unit_id || '',
          cost: material.cost?.toString() || '',
          category_id: material.category_id || ''
        })
      } else {
        // Creating new material
        setFormData({
          name: '',
          unit_id: '',
          cost: '',
          category_id: ''
        })
      }
    }
  }, [open, material])

  // Create/update material mutation
  const saveMaterialMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!supabase) throw new Error('Supabase not initialized')

      const materialData = {
        name: data.name,
        unit_id: data.unit_id || null,
        cost: parseFloat(data.cost) || 0,
        category_id: data.category_id || null
      }

      if (material) {
        // Update existing material
        const { error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', material.id)
        
        if (error) throw error
      } else {
        // Create new material
        const { error } = await supabase
          .from('materials')
          .insert([materialData])
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-materials'] })
      toast({
        title: material ? "Material actualizado" : "Material creado",
        description: material ? "El material ha sido actualizado correctamente." : "El material ha sido creado correctamente."
      })
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: material ? "No se pudo actualizar el material." : "No se pudo crear el material.",
        variant: "destructive"
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del material es requerido.",
        variant: "destructive"
      })
      return
    }

    saveMaterialMutation.mutate(formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="p-3 border-b border-[var(--card-border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              {material ? 'Editar Material' : 'Nuevo Material'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium required-asterisk">
              Nombre del Material
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ingresa el nombre del material"
              required
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
              value={formData.cost}
              onChange={(e) => handleInputChange('cost', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_id" className="text-xs font-medium">
              Unidad
            </Label>
            <Select value={formData.unit_id} onValueChange={(value) => handleInputChange('unit_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar unidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="m2">Metro cuadrado (m²)</SelectItem>
                <SelectItem value="m3">Metro cúbico (m³)</SelectItem>
                <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                <SelectItem value="un">Unidad (un)</SelectItem>
                <SelectItem value="m">Metro (m)</SelectItem>
                <SelectItem value="lt">Litro (lt)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id" className="text-xs font-medium">
              Categoría
            </Label>
            <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="construction">Construcción</SelectItem>
                <SelectItem value="electrical">Eléctrico</SelectItem>
                <SelectItem value="plumbing">Plomería</SelectItem>
                <SelectItem value="painting">Pintura</SelectItem>
                <SelectItem value="flooring">Pisos</SelectItem>
                <SelectItem value="roofing">Techos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--card-border)]">
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={saveMaterialMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saveMaterialMutation.isPending}
            >
              {saveMaterialMutation.isPending ? 'Guardando...' : material ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}