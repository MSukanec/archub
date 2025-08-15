import { FormModalLayout } from "@/components/modal/form/FormModalLayout"
import { FormModalHeader } from "@/components/modal/form/FormModalHeader"
import { FormModalFooter } from "@/components/modal/form/FormModalFooter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign } from "lucide-react"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { insertSubcontractBidSchema, type InsertSubcontractBid } from "../../../../../shared/schema"
import { useCreateSubcontractBid, useUpdateSubcontractBid } from "@/hooks/use-subcontract-bids"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useCurrencies } from "@/hooks/use-currencies"
import { useContacts } from "@/hooks/use-contacts"
import { toast } from "@/hooks/use-toast"

const formSchema = insertSubcontractBidSchema.extend({
  amount: z.coerce.number().min(0, "El monto debe ser mayor a 0"),
  exchange_rate: z.coerce.number().min(0).optional(),
})

type FormData = z.infer<typeof formSchema>

interface SubcontractBidFormModalProps {
  modalData?: {
    subcontractId: string
    subcontractBidId?: string
    projectId: string
    organizationId: string
    isEditing?: boolean
  }
  onClose: () => void
}

export function SubcontractBidFormModal({ modalData, onClose }: SubcontractBidFormModalProps) {
  const { data: userData } = useCurrentUser()
  const { data: currencies = [] } = useCurrencies()
  const { data: contacts = [] } = useContacts()
  const createSubcontractBid = useCreateSubcontractBid()
  const updateSubcontractBid = useUpdateSubcontractBid()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subcontract_id: modalData?.subcontractId || "",
      contact_id: "",
      title: "",
      amount: 0,
      currency_id: "",
      exchange_rate: 1,
      notes: "",
      status: "pendiente",
      valid_until: "",
    },
  })

  const isEditing = Boolean(modalData?.subcontractBidId)

  const handleSubmit = async (data: FormData) => {
    try {
      const bidData: InsertSubcontractBid = {
        ...data,
        subcontract_id: modalData?.subcontractId || "",
        // Si no hay contact_id, lo dejamos undefined
        contact_id: data.contact_id || undefined,
        // Si no hay currency_id, lo dejamos undefined
        currency_id: data.currency_id || undefined,
      }

      if (isEditing && modalData?.subcontractBidId) {
        await updateSubcontractBid.mutateAsync({
          id: modalData.subcontractBidId,
          ...bidData,
        })
        toast({
          title: "Oferta actualizada",
          description: "La oferta se actualizó correctamente",
        })
      } else {
        await createSubcontractBid.mutateAsync(bidData)
        toast({
          title: "Oferta creada",
          description: "La nueva oferta se creó correctamente",
        })
      }

      onClose()
    } catch (error) {
      console.error("Error al guardar la oferta:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la oferta",
        variant: "destructive",
      })
    }
  }

  const viewPanel = null // No necesitamos vista de solo lectura

  const editPanel = (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título de la Oferta *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Oferta para trabajo de albañilería"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcontratista (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exchange_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasa de Cambio</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="1"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="aceptada">Aceptada</SelectItem>
                      <SelectItem value="rechazada">Rechazada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valid_until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Válida Hasta (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detalles adicionales sobre la oferta..."
                    className="min-h-[100px]"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  )

  const headerContent = (
    <FormModalHeader
      title={isEditing ? "Editar Oferta" : "Nueva Oferta"}
      icon={DollarSign}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Actualizar" : "Crear Oferta"}
      onRightClick={form.handleSubmit(handleSubmit)}
      showLoadingSpinner={createSubcontractBid.isPending || updateSubcontractBid.isPending}
    />
  )

  return (
    <FormModalLayout
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true} // Siempre en modo edición
      onClose={onClose}
    />
  )
}