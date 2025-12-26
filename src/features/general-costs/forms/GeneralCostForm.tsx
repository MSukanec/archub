import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { useOrganizationMembers } from '@/features/organization'
import { useGeneralCostCategories } from '../hooks/use-general-cost-categories'
import { useCreateGeneralCost } from '../hooks/use-create-general-cost'
import { useUpdateGeneralCost } from '../hooks/use-update-general-cost'
import { useGeneralCost } from '../hooks/use-general-cost'
import { useGeneralCosts } from '../hooks/use-general-costs'
import { generalCostSchema, type GeneralCostFormData } from '../schemas'
import type { GeneralCost } from '../types'
interface FormPanelProps {
  form: ReturnType<typeof useForm<GeneralCostFormData>>
  categories: any[]
}
export function FormPanel({ form, categories }: FormPanelProps) {
  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Servicios administrativos, Gastos de oficina..."
                  {...field}
                  data-testid="input-general-cost-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-general-cost-category">
                    <SelectValue placeholder="Seleccionar categoría (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin categoría</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción detallada del gasto general..."
                  rows={3}
                  {...field}
                  data-testid="textarea-general-cost-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
interface ViewPanelProps {
  generalCost: GeneralCost
}
export function ViewPanel({ generalCost }: ViewPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Nombre</p>
        <p className="font-medium" data-testid="text-general-cost-name">
          {generalCost?.name}
        </p>
      </div>
      {generalCost?.description && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Descripción</p>
          <p className="text-sm whitespace-pre-wrap" data-testid="text-general-cost-description">
            {generalCost.description}
          </p>
        </div>
      )}
      {generalCost?.category && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Categoría</p>
          <p className="text-sm" data-testid="text-general-cost-category">
            {generalCost.category.name}
          </p>
        </div>
      )}
    </div>
  )
}
interface UseGeneralCostFormOptions {
  generalCostId?: string
  mode: 'create'| 'edit'| 'view'
  onSuccess: () => void
}
export function useGeneralCostForm({ generalCostId, mode, onSuccess }: UseGeneralCostFormOptions) {
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: members = [] } = useOrganizationMembers(organizationId || undefined)
  const { data: existingGeneralCost, isLoading: generalCostLoading } = useGeneralCost(
    mode === 'edit'|| mode === 'view'? generalCostId || null : null
  )
  const { data: allGeneralCosts = [] } = useGeneralCosts(organizationId || null)
  const { data: categories = [] } = useGeneralCostCategories(organizationId)
  const form = useForm<GeneralCostFormData>({
    resolver: zodResolver(generalCostSchema),
    defaultValues: { name: '', description: '', category_id: ''}
  })
  useEffect(() => {
    if (existingGeneralCost) {
      form.reset({
        name: existingGeneralCost.name || '',
        description: existingGeneralCost.description || '',
        category_id: existingGeneralCost.category_id || ''
      })
    }
  }, [existingGeneralCost, form])
  const createMutation = useCreateGeneralCost(organizationId || null)
  const updateMutation = useUpdateGeneralCost(organizationId || null)
  const onSubmit = async (data: GeneralCostFormData) => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'Faltan datos de organización',
        variant: 'destructive'
      })
      return
    }
    const normalizedName = data.name.trim().toLowerCase()
    const duplicate = allGeneralCosts.find((gc: any) => {
      const isSameName = gc.name.trim().toLowerCase() === normalizedName
      const isDifferentId = mode === 'edit'? gc.id !== generalCostId : true
      return isSameName && isDifferentId
    })
    if (duplicate) {
      toast({
        title: 'Nombre duplicado',
        description: `Ya existe un gasto general llamado "${duplicate.name}". Por favor, usa un nombre diferente.`,
        variant: 'destructive'
      })
      return
    }
    try {
      if (mode === 'edit'&& generalCostId) {
        await updateMutation.mutateAsync({
          generalCostId,
          organizationId,
          generalCost: {
            name: data.name,
            description: data.description || undefined,
            category_id: data.category_id || undefined
          }
        })
      } else {
        const currentMember = members.find((m: any) => m.user_id === userData?.user?.id)
        if (!currentMember) {
          toast({
            title: 'Error',
            description: 'No se encontró el miembro de la organización',
            variant: 'destructive'
          })
          return
        }
        await createMutation.mutateAsync({
          organization_id: organizationId,
          name: data.name,
          description: data.description || undefined,
          created_by: currentMember.id,
          category_id: data.category_id || undefined
        })
      }
      onSuccess()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el gasto general',
        variant: 'destructive'
      })
    }
  }
  return {
    form,
    onSubmit,
    editingGeneralCost: existingGeneralCost,
    categories,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    generalCostLoading,
  }
}
