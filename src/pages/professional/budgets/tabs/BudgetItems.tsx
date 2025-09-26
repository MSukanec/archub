import { DollarSign, Plus, Calculator, FolderOpen, TrendingUp, Edit, Trash2, Copy, MoreHorizontal } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useMemo } from 'react'
import { useMobile } from '@/hooks/use-mobile'
import { useBudgets, useDeleteBudget } from '@/hooks/use-budgets'
import { useCurrencies } from '@/hooks/use-currencies'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'

interface BudgetItemsProps {
  onEditBudget?: (budget: any) => void
  onAddBudget?: () => void
  onDuplicateBudget?: (budget: any) => void
}

export function BudgetItems({ 
  onEditBudget,
  onAddBudget,
  onDuplicateBudget
}: BudgetItemsProps) {
  const isMobile = useMobile()
  const { data: userData } = useCurrentUser()
  const { data: currencies } = useCurrencies()
  const { data: budgets = [], isLoading } = useBudgets(userData?.preferences?.last_project_id)
  const deleteBudgetMutation = useDeleteBudget()
  const { toast } = useToast()

  // Calculate KPIs based on budgets data
  const kpiData = useMemo(() => {
    const totalBudgets = budgets.length;
    
    // Group budgets by status
    const statusGroups = budgets.reduce((acc, budget) => {
      const status = budget.status || 'draft';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(budget);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Group budgets by currency
    const currencyGroups = budgets.reduce((acc, budget) => {
      const currencyId = budget.currency_id;
      if (!acc[currencyId]) {
        acc[currencyId] = [];
      }
      acc[currencyId].push(budget);
      return acc;
    }, {} as Record<string, any[]>);

    const totalStatuses = Object.keys(statusGroups).length;
    const totalCurrencies = Object.keys(currencyGroups).length;
    const draftBudgets = statusGroups['draft']?.length || 0;
    const approvedBudgets = statusGroups['approved']?.length || 0;
    const inProgressBudgets = statusGroups['in_progress']?.length || 0;
    const completedBudgets = statusGroups['completed']?.length || 0;

    return {
      totalBudgets,
      totalStatuses,
      totalCurrencies,
      draftBudgets,
      approvedBudgets,
      inProgressBudgets,
      completedBudgets
    };
  }, [budgets]);

  // Handle delete budget
  const handleDeleteBudget = async (budgetId: string, budgetName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el presupuesto "${budgetName}"?`)) {
      try {
        await deleteBudgetMutation.mutateAsync(budgetId);
      } catch (error) {
        console.error('Error deleting budget:', error);
      }
    }
  }

  // Handle duplicate budget
  const handleDuplicateBudget = (budget: any) => {
    if (onDuplicateBudget) {
      onDuplicateBudget(budget)
    }
  }

  // Get currency code by ID
  const getCurrencyCode = (currencyId: string) => {
    return currencies?.find(c => c.id === currencyId)?.code || 'N/A'
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default'
      case 'in_progress': return 'secondary'
      case 'completed': return 'outline'
      case 'draft':
      default: return 'destructive'
    }
  }

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador'
      case 'approved': return 'Aprobado'
      case 'in_progress': return 'En progreso'
      case 'completed': return 'Completado'
      default: return status
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando presupuestos...</div>
      </div>
    )
  }

  if (budgets.length === 0) {
    return (
      <div className="h-full">
        <EmptyState
          icon={<Calculator className="h-12 w-12 text-muted-foreground" />}
          title="Presupuestos del Proyecto"
          description="No hay presupuestos creados para este proyecto"
          action={
            onAddBudget && (
              <Button onClick={onAddBudget} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Crear Presupuesto
              </Button>
            )
          }
          className="h-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {kpiData && (
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
          {/* Total Presupuestos */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Presupuestos' : 'Total Presupuestos'}
                  </p>
                  <Calculator className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                <div className={`flex items-center justify-start ${isMobile ? 'h-6' : 'h-8'}`}>
                  <p className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold`} style={{ color: 'var(--accent)' }}>
                    {kpiData.totalBudgets}
                  </p>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {kpiData.totalCurrencies} monedas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Borradores */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Borradores' : 'En Borrador'}
                  </p>
                  <FolderOpen className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                <div className={`flex items-center justify-start ${isMobile ? 'h-6' : 'h-8'}`}>
                  <p className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold`} style={{ color: 'var(--accent)' }}>
                    {kpiData.draftBudgets}
                  </p>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    sin aprobar
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aprobados */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Aprobados' : 'Aprobados'}
                  </p>
                  <TrendingUp className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                <div className={`flex items-center justify-start ${isMobile ? 'h-6' : 'h-8'}`}>
                  <p className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold`} style={{ color: 'var(--accent)' }}>
                    {kpiData.approvedBudgets}
                  </p>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    listos para uso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completados */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Completos' : 'Completados'}
                  </p>
                  <DollarSign className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                <div className={`flex items-center justify-start ${isMobile ? 'h-6' : 'h-8'}`}>
                  <p className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold`} style={{ color: 'var(--accent)' }}>
                    {kpiData.completedBudgets}
                  </p>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    finalizados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budgets Table */}
      <Card>
        <CardContent className="p-0">
          {isMobile ? (
            // Mobile layout - Card view
            <div className="space-y-4 p-4">
              {budgets.map((budget) => (
                <Card key={budget.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h4 className="font-medium text-sm">{budget.name}</h4>
                        {budget.description && (
                          <p className="text-xs text-muted-foreground">{budget.description}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditBudget?.(budget)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateBudget(budget)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteBudget(budget.id, budget.name)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant={getStatusBadgeVariant(budget.status)}>
                        {getStatusLabel(budget.status)}
                      </Badge>
                      <span className="text-muted-foreground">v{budget.version}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{getCurrencyCode(budget.currency_id)}</span>
                      <span>{formatDate(budget.created_at)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop layout - Table view
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">{budget.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {budget.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(budget.status)}>
                        {getStatusLabel(budget.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>v{budget.version}</TableCell>
                    <TableCell>{getCurrencyCode(budget.currency_id)}</TableCell>
                    <TableCell>{formatDate(budget.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditBudget?.(budget)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateBudget(budget)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteBudget(budget.id, budget.name)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}