import { useState, useEffect } from 'react'
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

import { useCreateMaterialCategory, useUpdateMaterialCategory, useMaterialCategories, MaterialCategory, NewMaterialCategoryData } from '@/hooks/use-material-categories'

import { Tag } from 'lucide-react'

const materialCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  parent_id: z.string().optional().nullable(),
})

interface MaterialCategoryFormModalProps {
  modalData: {
    editingMaterialCategory?: MaterialCategory | null
    parentCategory?: { id: string; name: string } | null
  }
  onClose: () => void
}

export function MaterialCategoryFormModal({ modalData, onClose }: MaterialCategoryFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { editingMaterialCategory, parentCategory } = modalData
  const isEditing = !!editingMaterialCategory

  // Hooks
  const createMutation = useCreateMaterialCategory()
  const updateMutation = useUpdateMaterialCategory()
  const { data: allCategories = [] } = useMaterialCategories()
  const { setPanel } = useModalPanelStore()

  // Force edit mode when modal opens
  useEffect(() => {
    setPanel('edit')
  }, [])

  // Form setup
  const form = useForm<z.infer<typeof materialCategorySchema>>({
    resolver: zodResolver(materialCategorySchema),
    defaultValues: {
      name: '',
      parent_id: parentCategory?.id || null,
    },
  })

  // Helper function to flatten categories for the select
  const flattenCategories = (categories: MaterialCategory[], level = 0): Array<{ id: string; name: string; level: number }> => {
    const result: Array<{ id: string; name: string; level: number }> = [];
    
    categories.forEach(category => {
      // Skip the category we're editing to avoid circular references
      if (editingMaterialCategory?.id !== category.id) {
        result.push({
          id: category.id,
          name: category.name,
          level
        });
        
        if (category.children && category.children.length > 0) {
          result.push(...flattenCategories(category.children, level + 1));
        }
      }
    });
    
    return result;
  };

  const availableParentCategories = flattenCategories(allCategories);

  // Load editing data
  useEffect(() => {
    if (isEditing && editingMaterialCategory) {
      form.reset({
        name: editingMaterialCategory.name,
        parent_id: editingMaterialCategory.parent_id,
      })
    } else {
      form.reset({
        name: '',
        parent_id: parentCategory?.id || null,
      })
    }
  }, [isEditing, editingMaterialCategory, parentCategory, form])

  const onSubmit = async (data: z.infer<typeof materialCategorySchema>) => {
    setIsLoading(true)
    
    try {
      if (isEditing && editingMaterialCategory) {
        await updateMutation.mutateAsync({
          id: editingMaterialCategory.id,
          data: data as Partial<NewMaterialCategoryData>
        })
      } else {
        await createMutation.mutateAsync(data as NewMaterialCategoryData)
      }
      
      onClose()
      form.reset()
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  // View panel (not needed for this modal as it's always in edit mode)
  const viewPanel = null

  // Edit panel with form
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Parent Category */}
        <FormField
          control={form.control}
          name="parent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría Padre (Opcional)</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value === "null" ? null : value)} 
                value={field.value || "null"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría padre" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">Sin categoría padre</SelectItem>
                  {availableParentCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span style={{ paddingLeft: `${category.level * 12}px` }}>
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Categoría *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Cementos y Aglomerantes"
                  {...field}
                />
              </FormControl>
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
      title={isEditing ? "Editar Categoría de Material" : "Nueva Categoría de Material"}
      icon={Tag}
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