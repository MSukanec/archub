import React, { useState, useEffect } from 'react'
import { CustomModalLayout } from '@/components/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/modal/CustomModalFooter'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useTopLevelCategories, useSubcategories, useElementCategories, useUnits, useActions, useElements } from '@/hooks/use-task-categories'
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import { useCurrentUser } from '@/hooks/use-current-user'
import { toast } from '@/hooks/use-toast'

interface NewAdminTaskModalProps {
  open: boolean
  onClose: () => void
  task?: any
}

export function NewAdminTaskModal({ open, onClose, task }: NewAdminTaskModalProps) {
  const { data: userData } = useCurrentUser()
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [unitLaborPrice, setUnitLaborPrice] = useState<number>(0)
  const [unitMaterialPrice, setUnitMaterialPrice] = useState<number>(0)
  
  // Hierarchical category state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('')
  const [selectedElementCategoryId, setSelectedElementCategoryId] = useState<string>('')
  
  // Additional fields state
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [selectedActionId, setSelectedActionId] = useState<string>('')
  const [selectedElementId, setSelectedElementId] = useState<string>('')
  
  // Data hooks
  const { data: categories = [] } = useTopLevelCategories()
  const { data: subcategories = [] } = useSubcategories(selectedCategoryId || null)
  const { data: elementCategories = [] } = useElementCategories(selectedSubcategoryId || null)
  const { data: units = [] } = useUnits()
  const { data: actions = [] } = useActions()
  const { data: elements = [] } = useElements()
  
  // Mutations
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()

  // Effect to populate form when editing
  useEffect(() => {
    if (task && open) {
      setName(task.name || '')
      setDescription(task.description || '')
      setUnitLaborPrice(task.unit_labor_price || 0)
      setUnitMaterialPrice(task.unit_material_price || 0)
      setSelectedCategoryId(task.category_id || '')
      setSelectedSubcategoryId(task.subcategory_id || '')
      setSelectedElementCategoryId(task.element_category_id || '')
      setSelectedUnitId(task.unit_id || '')
      setSelectedActionId(task.action_id || '')
      setSelectedElementId(task.element_id || '')
    }
  }, [task, open])

  // Handle category selection to unlock subcategories
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setSelectedSubcategoryId('') // Reset subcategory
    setSelectedElementCategoryId('') // Reset element category
  }

  // Handle subcategory selection to unlock element categories
  const handleSubcategoryChange = (subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId)
    setSelectedElementCategoryId('') // Reset element category
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la tarea es requerido",
        variant: "destructive"
      })
      return
    }

    if (!userData?.organization?.id) {
      toast({
        title: "Error",
        description: "No se encontró la organización",
        variant: "destructive"
      })
      return
    }

    const taskData = {
      name: name.trim(),
      description: description.trim() || undefined,
      organization_id: userData.organization.id,
      category_id: selectedCategoryId || undefined,
      subcategory_id: selectedSubcategoryId || undefined,
      element_category_id: selectedElementCategoryId || undefined,
      unit_id: selectedUnitId || undefined,
      action_id: selectedActionId || undefined,
      element_id: selectedElementId || undefined,
      unit_labor_price: unitLaborPrice || 0,
      unit_material_price: unitMaterialPrice || 0
    }

    try {
      if (task) {
        // Editing existing task
        await updateTaskMutation.mutateAsync({
          id: task.id,
          ...taskData
        })
      } else {
        // Creating new task
        await createTaskMutation.mutateAsync(taskData)
      }
      
      handleClose()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleClose = () => {
    // Reset form
    setName('')
    setDescription('')
    setUnitLaborPrice(0)
    setUnitMaterialPrice(0)
    setSelectedCategoryId('')
    setSelectedSubcategoryId('')
    setSelectedElementCategoryId('')
    setSelectedUnitId('')
    setSelectedActionId('')
    setSelectedElementId('')
    onClose()
  }

  const isLoading = createTaskMutation.isPending || updateTaskMutation.isPending

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={task ? "Editar tarea" : "Nueva tarea"}
            description={task ? "Modifica la información de la tarea" : "Crea una nueva tarea administrativa"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Accordion type="single" defaultValue="datos-basicos" className="space-y-2">
              {/* Datos Básicos */}
              <AccordionItem value="datos-basicos">
                <AccordionTrigger className="text-sm font-medium">
                  Datos Básicos
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-3">
                  {/* Nombre de la tarea */}
                  <div>
                    <Label className="text-sm font-medium">Nombre de la Tarea</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ingresa el nombre de la tarea"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <Label className="text-sm font-medium">Descripción</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descripción opcional de la tarea..."
                      className="min-h-[80px]"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Categorización */}
              <AccordionItem value="categorizacion">
                <AccordionTrigger className="text-sm font-medium">
                  Categorización
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-3">
                  {/* Categoría principal */}
                  <div>
                    <Label className="text-sm font-medium">Categoría</Label>
                    <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
                      <SelectTrigger>
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

                  {/* Subcategoría */}
                  {selectedCategoryId && (
                    <div>
                      <Label className="text-sm font-medium">Subcategoría</Label>
                      <Select value={selectedSubcategoryId} onValueChange={handleSubcategoryChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una subcategoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategories.map((subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Elemento (Categoría de tercer nivel) */}
                  {selectedSubcategoryId && (
                    <div>
                      <Label className="text-sm font-medium">Elemento (Categoría)</Label>
                      <Select value={selectedElementCategoryId} onValueChange={setSelectedElementCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un elemento" />
                        </SelectTrigger>
                        <SelectContent>
                          {elementCategories.map((element) => (
                            <SelectItem key={element.id} value={element.id}>
                              {element.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Especificaciones Técnicas */}
              <AccordionItem value="especificaciones">
                <AccordionTrigger className="text-sm font-medium">
                  Especificaciones Técnicas
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Unidad */}
                    <div>
                      <Label className="text-sm font-medium">Unidad</Label>
                      <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona unidad" />
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

                    {/* Acción */}
                    <div>
                      <Label className="text-sm font-medium">Acción</Label>
                      <Select value={selectedActionId} onValueChange={setSelectedActionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona acción" />
                        </SelectTrigger>
                        <SelectContent>
                          {actions.map((action) => (
                            <SelectItem key={action.id} value={action.id}>
                              {action.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Elemento */}
                    <div>
                      <Label className="text-sm font-medium">Elemento</Label>
                      <Select value={selectedElementId} onValueChange={setSelectedElementId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona elemento" />
                        </SelectTrigger>
                        <SelectContent>
                          {elements.map((element) => (
                            <SelectItem key={element.id} value={element.id}>
                              {element.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Costos */}
              <AccordionItem value="costos">
                <AccordionTrigger className="text-sm font-medium">
                  Costos
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Precio Unitario Mano de Obra</Label>
                      <Input
                        type="number"
                        value={unitLaborPrice}
                        onChange={(e) => setUnitLaborPrice(Number(e.target.value) || 0)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Precio Unitario Materiales</Label>
                      <Input
                        type="number"
                        value={unitMaterialPrice}
                        onChange={(e) => setUnitMaterialPrice(Number(e.target.value) || 0)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={handleSubmit}
            cancelText="Cancelar"
            saveText={task ? "Actualizar Tarea" : "Crear Tarea"}
            isLoading={isLoading}
          />
        )
      }}
    </CustomModalLayout>
  )
}