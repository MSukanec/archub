import React, { useState, useEffect } from 'react'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { useTopLevelCategories, useSubcategories, useElementCategories } from '@/hooks/use-task-categories'
import { toast } from '@/hooks/use-toast'

interface NewAdminTaskModalProps {
  open: boolean
  onClose: () => void
  task?: any
}

export function NewAdminTaskModal({ open, onClose, task }: NewAdminTaskModalProps) {
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedElement, setSelectedElement] = useState('')
  const [unitLaborPrice, setUnitLaborPrice] = useState(0)
  const [unitMaterialPrice, setUnitMaterialPrice] = useState(0)
  
  // Hierarchical category state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('')
  const [selectedElementCategoryId, setSelectedElementCategoryId] = useState<string>('')
  
  // Data hooks with hierarchical structure
  const { data: categories = [] } = useTopLevelCategories()
  const { data: subcategories = [] } = useSubcategories(selectedCategoryId || null)
  const { data: elementCategories = [] } = useElementCategories(selectedSubcategoryId || null)

  // Auto-generate task name when action and element are entered
  useEffect(() => {
    if (selectedAction && selectedElement) {
      const generatedName = `${selectedAction} de ${selectedElement}`
      setName(generatedName)
    }
  }, [selectedAction, selectedElement])

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

    try {
      // Here you would implement the actual save logic
      console.log('Task data:', {
        name,
        description,
        category_id: selectedCategoryId,
        subcategory_id: selectedSubcategoryId,
        element_category_id: selectedElementCategoryId,
        action: selectedAction,
        element: selectedElement,
        unit_labor_price: unitLaborPrice,
        unit_material_price: unitMaterialPrice
      })
      
      toast({
        title: "Éxito",
        description: "Tarea guardada correctamente"
      })
      
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar la tarea",
        variant: "destructive"
      })
    }
  }

  const handleClose = () => {
    // Reset form
    setName('')
    setDescription('')
    setSelectedAction('')
    setSelectedElement('')
    setUnitLaborPrice(0)
    setUnitMaterialPrice(0)
    setSelectedCategoryId('')
    setSelectedSubcategoryId('')
    setSelectedElementCategoryId('')
    onClose()
  }

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
            <Accordion type="multiple" defaultValue={["datos-basicos", "costos", "materiales"]} className="space-y-2">
              {/* Datos Básicos */}
              <AccordionItem value="datos-basicos">
                <AccordionTrigger className="text-sm font-medium">
                  Datos Básicos
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-3">
                  {/* Auto-generated name field */}
                  <div>
                    <Label className="text-sm font-medium">Nombre de la Tarea</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Se genera automáticamente al completar Acción y Elemento"
                      className="bg-muted"
                    />
                  </div>

                  {/* Action and Element fields for auto-generation */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Acción</Label>
                      <Input
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value)}
                        placeholder="Ej: Construcción"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Elemento</Label>
                      <Input
                        value={selectedElement}
                        onChange={(e) => setSelectedElement(e.target.value)}
                        placeholder="Ej: Muro"
                      />
                    </div>
                  </div>

                  {/* Hierarchical Categories */}
                  <div className="space-y-3">
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
                  </div>

                  {/* Description */}
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

              {/* Costos */}
              <AccordionItem value="costos">
                <AccordionTrigger className="text-sm font-medium">
                  Costos
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Precio Unitario Mano de Obra</Label>
                      <Input
                        type="number"
                        value={unitLaborPrice}
                        onChange={(e) => setUnitLaborPrice(Number(e.target.value))}
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
                        onChange={(e) => setUnitMaterialPrice(Number(e.target.value))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Lista de Materiales */}
              <AccordionItem value="materiales">
                <AccordionTrigger className="text-sm font-medium">
                  Lista de Materiales
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-3">
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Funcionalidad de materiales disponible próximamente</p>
                    <p className="text-xs mt-1">Podrás asociar materiales específicos a cada tarea</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter>
            <Button variant="secondary" onClick={handleClose} className="w-1/4">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="w-3/4">
              {task ? "Actualizar" : "Crear"} Tarea
            </Button>
          </CustomModalFooter>
        )
      }}
    </CustomModalLayout>
  )
}