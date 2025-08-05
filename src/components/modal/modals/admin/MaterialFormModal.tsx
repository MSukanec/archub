import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CascadingSelect } from '@/components/ui-custom/CascadingSelect'

import { useCreateMaterial, useUpdateMaterial, Material, NewMaterialData } from '@/hooks/use-materials'
import { useMaterialCategories, MaterialCategory } from '@/hooks/use-material-categories'
import { useUnits } from '@/hooks/use-units'
import { useCurrentUser } from '@/hooks/use-current-user'

import { Package } from 'lucide-react'

const materialSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category_id: z.string().min(1, 'La categoría es requerida'),
  unit_id: z.string().min(1, 'La unidad es requerida'),
})

// Helper function to convert MaterialCategory[] to CascadingSelect format
function convertToCascadingOptions(categories: MaterialCategory[]): any[] {
  return categories.map(category => ({
    value: category.id,
    label: category.name,
    children: category.children && category.children.length > 0 
      ? convertToCascadingOptions(category.children) 
      : undefined
  }))
}

// Helper function to find category path by ID
function findCategoryPath(categories: MaterialCategory[], targetId: string): string[] {
  function search(cats: MaterialCategory[], path: string[] = []): string[] | null {
    for (const cat of cats) {
      const currentPath = [...path, cat.id];
      
      if (cat.id === targetId) {
        return currentPath;
      }
      
      if (cat.children && cat.children.length > 0) {
        const result = search(cat.children, currentPath);
        if (result) return result;
      }
    }
    return null;
  }
  
  return search(categories) || [];
}

interface MaterialFormModalProps {
  modalData: {
    editingMaterial?: Material | null
  }
  onClose: () => void
}

export function MaterialFormModal({ modalData, onClose }: MaterialFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { editingMaterial } = modalData
  const isEditing = !!editingMaterial

  // Hooks
  const createMutation = useCreateMaterial()
  const updateMutation = useUpdateMaterial()
  const { data: userData } = useCurrentUser()
  const { data: categories = [] } = useMaterialCategories()
  const { data: units = [] } = useUnits()
  const { setPanel } = useModalPanelStore()
  
  // Convert categories to cascading format - memoize to prevent recreation
  const cascadingOptions = useMemo(() => 
    convertToCascadingOptions(categories), 
    [categories]
  )
  
  // Track selected category path for CascadingSelect
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>([])

  // Remove the forced edit mode - let users access the modal freely
  // useEffect(() => {
  //   setPanel('edit')
  // }, [])

  // Form setup
  const form = useForm<z.infer<typeof materialSchema>>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      category_id: '',
      unit_id: '',
    },
  })

  // Load editing data
  useEffect(() => {
    if (isEditing && editingMaterial && categories.length > 0) {
      form.reset({
        name: editingMaterial.name,
        category_id: editingMaterial.category_id,
        unit_id: editingMaterial.unit_id,
      })
      
      // Set the category path for CascadingSelect
      const path = findCategoryPath(categories, editingMaterial.category_id)
      setSelectedCategoryPath(path)
    } else if (!isEditing) {
      form.reset({
        name: '',
        category_id: '',
        unit_id: '',
      })
      setSelectedCategoryPath([])
    }
  }, [editingMaterial?.id, isEditing, categories.length])

  // Submit handler
  const onSubmit = async (values: z.infer<typeof materialSchema>) => {
    setIsLoading(true)

    try {
      if (isEditing && editingMaterial) {
        // Actualizar material
        await updateMutation.mutateAsync({
          id: editingMaterial.id,
          data: {
            name: values.name,
            unit_id: values.unit_id,
            category_id: values.category_id,
          },
        })
      } else {
        // Crear material
        const materialData: NewMaterialData = {
          name: values.name,
          category_id: values.category_id,
          unit_id: values.unit_id,
          organization_id: userData?.organization?.id,
          is_system: false,
        }
        
        await createMutation.mutateAsync(materialData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving material:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // View panel (not needed for this modal as it's always in edit mode)
  const viewPanel = null

  // Determinar si el material es del sistema
  const isSystemMaterial = editingMaterial?.is_system && editingMaterial?.organization_id !== userData?.organization?.id

  // Edit panel
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Material Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Material *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Cemento Portland"
                  disabled={isSystemMaterial}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría *</FormLabel>
              <FormControl>
                <CascadingSelect
                  options={cascadingOptions}
                  value={selectedCategoryPath}
                  onValueChange={(path) => {
                    setSelectedCategoryPath(path)
                    // Set the deepest (last) category ID as the form value
                    const deepestCategoryId = path[path.length - 1] || ''
                    field.onChange(deepestCategoryId)
                  }}
                  placeholder="Seleccionar categoría..."
                  disabled={isSystemMaterial}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Unit */}
        <FormField
          control={form.control}
          name="unit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad de Cómputo *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSystemMaterial}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad de cómputo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )

  // Header content
  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Material" : "Nuevo Material"}
      icon={Package}
    />
  )

  // Footer content
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Actualizar" : "Crear"}
      onRightClick={form.handleSubmit(onSubmit)}
      submitDisabled={isLoading}
      showLoadingSpinner={isLoading}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  )
}