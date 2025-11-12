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
import { Switch } from '@/components/ui/switch'
import { CascadingSelect } from '@/components/ui-custom/fields/CascadingSelectField'

import { useCreateMaterial, useUpdateMaterial, Material, NewMaterialData } from '@/hooks/use-materials'
import { useMaterialCategories, MaterialCategory } from '@/hooks/use-material-categories'
import { useUnits } from '@/hooks/use-units'
import { useCurrentUser } from '@/hooks/use-current-user'

import { Package } from 'lucide-react'

const materialSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  material_type: z.enum(['material', 'consumable'], { required_error: 'Selecciona el tipo de material' }),
  category_id: z.string().min(1, 'La categoría es requerida'),
  unit_id: z.string().min(1, 'La unidad es requerida'),
  is_completed: z.boolean().optional(),
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

// Helper function to find category ID by name
function findCategoryIdByName(categories: MaterialCategory[], targetName: string): string | null {
  function search(cats: MaterialCategory[]): string | null {
    for (const cat of cats) {
      if (cat.name === targetName) {
        return cat.id;
      }
      
      if (cat.children && cat.children.length > 0) {
        const result = search(cat.children);
        if (result) return result;
      }
    }
    return null;
  }
  
  return search(categories);
}

interface MaterialFormModalProps {
  modalData: {
    editingMaterial?: Material | null
    isDuplicating?: boolean
  }
  onClose: () => void
}

export function MaterialFormModal({ modalData, onClose }: MaterialFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { editingMaterial, isDuplicating = false } = modalData
  const isEditing = !!editingMaterial && !isDuplicating

  // Hooks
  const createMutation = useCreateMaterial()
  const updateMutation = useUpdateMaterial()
  const { data: userData } = useCurrentUser()
  const { data: categories = [] } = useMaterialCategories()
  const { data: units = [] } = useUnits()
  const { setPanel } = useModalPanelStore()
  
  // Convert categories to cascading format - memoize to prevent recreation
  const cascadingOptions = useMemo(() => {
    const options = convertToCascadingOptions(categories)
    console.log('Cascading options:', options)
    return options
  }, [categories])
  
  // Track selected category path for CascadingSelect
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>([])

  // Force edit mode when modal opens - enable user access
  useEffect(() => {
    setPanel('edit')
  }, [])

  // Form setup
  const form = useForm<z.infer<typeof materialSchema>>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      material_type: 'material',
      category_id: '',
      unit_id: '',
      is_completed: false,
    },
  })

  // Load editing data
  useEffect(() => {
    console.log('MaterialFormModal useEffect triggered:', { 
      isEditing, 
      isDuplicating,
      hasEditingMaterial: !!editingMaterial, 
      categoriesLength: categories.length,
      unitsLength: units.length 
    })
    
    if ((isEditing || isDuplicating) && editingMaterial && categories.length > 0) {
      // For materials from materials_view, use category_id directly (now included in the view)
      const categoryId = (editingMaterial as any).category_id || 
                        findCategoryIdByName(categories, (editingMaterial as any).category_name) || 
                        ''
      
      form.reset({
        name: isDuplicating ? `${editingMaterial.name} - Copia` : editingMaterial.name,
        material_type: (editingMaterial.material_type as 'material' | 'consumable') || 'material',
        category_id: categoryId,
        unit_id: editingMaterial.unit_id,
        is_completed: editingMaterial.is_completed || false,
      })
      
      // Set the category path for CascadingSelect
      const path = findCategoryPath(categories, categoryId)
      setSelectedCategoryPath(path)
    } else if (!isEditing && !isDuplicating) {
      form.reset({
        name: '',
        material_type: 'material',
        category_id: '',
        unit_id: '',
        is_completed: false,
      })
      setSelectedCategoryPath([])
    }
  }, [editingMaterial?.id, isEditing, isDuplicating, categories.length])

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
            material_type: values.material_type,
            unit_id: values.unit_id,
            category_id: values.category_id,
            is_completed: values.is_completed,
          },
        })
      } else {
        // Crear material
        const materialData: NewMaterialData = {
          name: values.name,
          material_type: values.material_type,
          category_id: values.category_id,
          unit_id: values.unit_id,
          is_completed: values.is_completed,
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

  // Allow editing all materials - remove system material blocking
  const isSystemMaterial = false

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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Material Type */}
        <FormField
          control={form.control}
          name="material_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Material *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de material" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="consumable">Insumo</SelectItem>
                </SelectContent>
              </Select>
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
              <Select onValueChange={field.onChange} value={field.value}>
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



        {/* Is Completed */}
        <FormField
          control={form.control}
          name="is_completed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Material Completado
                </FormLabel>
                <div className="text-sm text-muted-foreground">
                  Marca este material como completado
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )

  // Header content
  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Material" : isDuplicating ? "Duplicar Material" : "Nuevo Material"}
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
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}