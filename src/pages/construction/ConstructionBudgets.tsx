import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Calculator, Plus, Trash2, Building2 } from 'lucide-react'
import { CustomTable } from '@/components/ui-custom/misc/CustomTable'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
import { NewBudgetModal } from '@/modals/NewBudgetModal'
import NewBudgetTaskModal from '@/modals/NewBudgetTaskModal'
import { useBudgets } from '@/hooks/use-budgets'
import { useBudgetTasks } from '@/hooks/use-budget-tasks'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Budget {
  id: string
  name: string
  description?: string
  project_id: string
  organization_id: string
  status: string
  created_at: string
  created_by: string
}

interface BudgetTask {
  id: string
  budget_id: string
  task_id: string
  quantity: number
  unit_labor_price: number
  unit_material_price: number
  total_labor_cost: number
  total_material_cost: number
  total_cost: number
  task: {
    name: string
    description?: string
    unit: {
      name: string
      abbreviation: string
    }
  }
}

export default function ConstructionBudgets() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [newBudgetModalOpen, setNewBudgetModalOpen] = useState(false)
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null)
  const [expandedAccordion, setExpandedAccordion] = useState<string>('')

  const { data: userData, isLoading } = useCurrentUser()
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets(userData?.preferences?.last_project_id)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Filter and sort budgets
  const filteredBudgets = budgets
    .filter((budget: Budget) =>
      budget.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      budget.description?.toLowerCase().includes(searchValue.toLowerCase())
    )
    .sort((a: Budget, b: Budget) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      if (!supabase) throw new Error('Supabase client not available')
      
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto ha sido eliminado correctamente",
      })
      setDeletingBudget(null)
    },
    onError: (error) => {
      console.error('Error deleting budget:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el presupuesto",
        variant: "destructive",
      })
    }
  })

  const handleDeleteBudget = (budget: Budget) => {
    setDeletingBudget(budget)
  }

  const handleAddTask = (budgetId: string) => {
    // TODO: Implement add task to budget functionality
    console.log('Add task to budget:', budgetId)
  }

  // Custom filters for the header
  const customFilters = (
    <div className="flex gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Fecha</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="status">Estado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('created_at')
  }

  const actions = [
    <Button 
      key="new-budget"
      className="h-8 px-3 text-sm"
      onClick={() => setNewBudgetModalOpen(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Nuevo Presupuesto
    </Button>
  ]

  const headerProps = {
    icon: Calculator,
    title: "Presupuestos",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    customFilters,
    onClearFilters: clearFilters,
    actions
  }

  if (isLoading || budgetsLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          Cargando presupuestos...
        </div>
      </Layout>
    )
  }

  // Budget task table columns
  const budgetTaskColumns = [
    {
      key: 'task.name' as keyof BudgetTask,
      label: 'Tarea',
      render: (task: BudgetTask) => (
        <div>
          <div className="font-medium text-sm">{task.task.name}</div>
          {task.task.description && (
            <div className="text-xs text-muted-foreground">{task.task.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'quantity' as keyof BudgetTask,
      label: 'Cantidad',
      render: (task: BudgetTask) => (
        <span className="text-sm">
          {task.quantity} {task.task.unit.abbreviation}
        </span>
      )
    },
    {
      key: 'unit_labor_price' as keyof BudgetTask,
      label: 'Precio M.O.',
      render: (task: BudgetTask) => (
        <span className="text-sm">
          ${task.unit_labor_price.toLocaleString()}
        </span>
      )
    },
    {
      key: 'unit_material_price' as keyof BudgetTask,
      label: 'Precio Mat.',
      render: (task: BudgetTask) => (
        <span className="text-sm">
          ${task.unit_material_price.toLocaleString()}
        </span>
      )
    },
    {
      key: 'total_cost' as keyof BudgetTask,
      label: 'Total',
      render: (task: BudgetTask) => (
        <span className="text-sm font-medium">
          ${task.total_cost.toLocaleString()}
        </span>
      )
    }
  ]

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {filteredBudgets.length === 0 ? (
          <CustomEmptyState
            icon={<Calculator className="w-12 h-12 text-muted-foreground" />}
            title={searchValue ? "No se encontraron presupuestos" : "No hay presupuestos creados"}
            description={searchValue 
              ? 'Prueba ajustando los filtros de búsqueda' 
              : 'Comienza creando tu primer presupuesto para gestionar los costos del proyecto'
            }
            action={
              !searchValue && (
                <Button onClick={() => setNewBudgetModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Presupuesto
                </Button>
              )
            }
          />
        ) : (
          <Accordion 
            type="single" 
            collapsible 
            value={expandedAccordion}
            onValueChange={setExpandedAccordion}
            className="space-y-4"
          >
            {filteredBudgets.map((budget: Budget) => (
              <AccordionItem 
                key={budget.id} 
                value={budget.id}
                className="border rounded-lg overflow-hidden"
              >
                <Card className="border-0">
                  <AccordionTrigger className="hover:no-underline p-0">
                    <CardContent className="flex items-center justify-between w-full p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium text-sm">{budget.name}</h3>
                          {budget.description && (
                            <p className="text-xs text-muted-foreground">{budget.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddTask(budget.id)
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Agregar Tarea
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBudget(budget)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-4 pb-4">
                    <div className="pt-4 border-t">
                      <CustomTable
                        data={[]} // TODO: Load budget tasks
                        columns={budgetTaskColumns}
                        isLoading={false}
                      />
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* New Budget Modal */}
      {newBudgetModalOpen && (
        <NewBudgetModal
          open={newBudgetModalOpen}
          onClose={() => setNewBudgetModalOpen(false)}
        />
      )}

      {/* Delete Budget Dialog */}
      <AlertDialog open={!!deletingBudget} onOpenChange={() => setDeletingBudget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el presupuesto "{deletingBudget?.name}" y todas sus tareas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingBudget && deleteBudgetMutation.mutate(deletingBudget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}