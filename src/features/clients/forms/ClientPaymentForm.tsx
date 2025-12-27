import React, { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseLocalDate, formatDateForDB } from '@/lib/date-utils'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/features/users/hooks'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { formatContactName } from '@/utils/contacts'
import { uploadFile, deleteFile } from '@/lib/storage'
import { FileUploader } from '@/components/shared/fields/FileUploader'
import { useQueryClient } from '@tanstack/react-query'
import { ComboBox } from '@/components/shared/fields/ComboBoxWriteField'
import { IdentityBadge } from '@/components/shared/IdentityBadge'
import {
  useProjectClients,
  useClientPayment,
  useCreateClientPayment,
  useUpdateClientPayment,
  useClientCommitments,
} from '@/features/clients/hooks'
import { getClientPaymentStatusBadgeConfig } from '@/features/clients/utils/statusBadge'

const clientPaymentSchema = z.object({
  payment_date: z.date({
    required_error: "Fecha de pago es requerida",
  }),
  created_by: z.string().min(1, 'Creador es requerido'),
  project_id: z.string().optional(),
  client_id: z.string().min(1, 'Cliente es requerido'),
  commitment_id: z.string().optional(),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  exchange_rate: z.number().min(0.0001, 'Tipo de cambio debe ser mayor a 0').optional().nullable(),
  status: z.enum(['confirmed', 'pending', 'rejected', 'void']),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type ClientPaymentFormData = z.infer<typeof clientPaymentSchema>

function FormPanel({
  form,
  onSubmit,
  projectClients,
  clientsLoading,
  commitments,
  commitmentsLoading,
  currencies,
  currenciesLoading,
  wallets,
  walletsLoading,
  projects,
  projectsLoading,
  projectId,
  isLoading,
  filesToUpload,
  setFilesToUpload,
  existingFiles,
  onExistingFileDelete,
}: {
  form: ReturnType<typeof useForm<ClientPaymentFormData>>;
  onSubmit: (data: ClientPaymentFormData) => void;
  projectClients: any[];
  clientsLoading: boolean;
  commitments: any[];
  commitmentsLoading: boolean;
  currencies: any[];
  currenciesLoading: boolean;
  wallets: any[];
  walletsLoading: boolean;
  projects: any[];
  projectsLoading: boolean;
  projectId?: string;
  isLoading: boolean;
  filesToUpload: any[];
  setFilesToUpload: (files: any[]) => void;
  existingFiles: any[];
  onExistingFileDelete?: (fileId: string) => Promise<void>;
}) {
  // Extract unique values for filters
  const selectedClientId = form.watch('client_id');
  const project_id = form.watch('project_id');

  const clientOptions = useMemo(() => {
    if (!projectClients) return []

    return projectClients
      .map(client => {
        const name = client.contact_full_name ||
                    client.contact_company_name ||
                    `${client.contact_first_name || ''} ${client.contact_last_name || ''}`.trim() ||
                    '-';

        const avatarUrl = client.linked_user_avatar_url
          || (client.contact_image_bucket && client.contact_image_path
            ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${client.contact_image_bucket}/${client.contact_image_path}`
            : null);

        return {
          value: client.id,
          label: name,
          avatarUrl,
          roleName: client.role_name,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
  }, [projectClients])

  const renderClientOption = (option: typeof clientOptions[number]) => (
    <IdentityBadge
      name={option.label}
      avatarUrl={option.avatarUrl}
      size="xs"
      subLabel={option.roleName}
    />
  )

  const clientCommitments = useMemo(() => {
    if (!commitments || !selectedClientId) return [];
    return commitments.filter(c => c.client_id === selectedClientId);
  }, [commitments, selectedClientId]);

  const commitmentOptions = useMemo(() => {
    return clientCommitments.map(c => ({
      value: c.id,
      label: c.unit_name 
        ? `${c.unit_name}${c.currency?.symbol ? ` - ${c.currency.symbol} ${c.amount?.toLocaleString('es-AR') || '0'}` : ''}`
        : `Compromiso ${c.currency?.symbol ? `- ${c.currency.symbol} ${c.amount?.toLocaleString('es-AR') || '0'}` : ''}`,
    }));
  }, [clientCommitments]);

  React.useEffect(() => {
    if (clientCommitments.length === 1) {
      form.setValue('commitment_id', clientCommitments[0].id);
    } else if (clientCommitments.length === 0) {
      form.setValue('commitment_id', undefined);
    }
  }, [clientCommitments, form])

  const activeProjects = useMemo(() => {
    if (!projects) return [];
    // Only show projects that are 'in_process'
    return projects.filter(p => p.status === 'in_process');
  }, [projects]);

  const projectOptions = useMemo(() => {
    return activeProjects.map(p => ({
      value: p.id,
      label: p.name,
    }));
  }, [activeProjects]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Cargando datos del formulario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Top Section with Project Selector if not provided */}
      {!projectId && (
        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem className="mb-2">
              <FormLabel>
                Proyecto <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange} disabled={projectsLoading}>
                  <SelectTrigger data-testid="select-payment-project">
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectOptions.map((project) => (
                      <SelectItem key={project.value} value={project.value}>
                        {project.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="payment_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Fecha de Pago <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        placeholder="Seleccionar fecha"
                        value={field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : ''}
                        className="pr-10 cursor-pointer"
                        readOnly
                        data-testid="input-payment-date"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Cliente <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <ComboBox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={clientOptions}
                  placeholder="Seleccionar cliente"
                  searchPlaceholder="Buscar cliente..."
                  emptyMessage="No se encontraron clientes"
                  renderOption={(option) => renderClientOption(option as typeof clientOptions[number])}
                  data-testid="combobox-payment-client"
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
          name="wallet_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Billetera <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange} disabled={walletsLoading}>
                  <SelectTrigger data-testid="select-payment-wallet">
                    <SelectValue placeholder="Seleccionar billetera" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets?.map((orgWallet) => (
                      <SelectItem 
                        key={orgWallet.id} 
                        value={orgWallet.id}
                      >
                        {orgWallet.wallets?.name || 'Sin nombre'}
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Monto <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  data-testid="input-payment-amount"
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
          name="currency_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Moneda <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange} disabled={currenciesLoading}>
                  <SelectTrigger data-testid="select-payment-currency">
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies?.map((orgCurrency) => (
                      <SelectItem 
                        key={orgCurrency.currency?.id} 
                        value={orgCurrency.currency?.id || ''}
                      >
                        {orgCurrency.currency?.name} ({orgCurrency.currency?.symbol})
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
          name="exchange_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Cambio (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  placeholder="1.0000"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  data-testid="input-payment-exchange-rate"
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
          name="commitment_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compromiso</FormLabel>
              <FormControl>
                <Select 
                  value={field.value || ''} 
                  onValueChange={field.onChange}
                  disabled={commitmentsLoading || !selectedClientId || clientCommitments.length === 0}
                >
                  <SelectTrigger data-testid="select-payment-commitment">
                    <SelectValue placeholder={
                      !selectedClientId 
                        ? "Selecciona un cliente primero" 
                        : clientCommitments.length === 0 
                          ? "Sin compromisos" 
                          : "Seleccionar compromiso"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {commitmentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Estado <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-payment-status">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                    <SelectItem value="void">Anulado</SelectItem>
                  </SelectContent>
                </Select>
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
            <FormLabel>Notas (opcional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Agregar notas adicionales sobre el pago..."
                rows={2}
                {...field}
                data-testid="textarea-payment-notes"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="reference"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Referencia (opcional)</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: TRX-12345"
                {...field}
                data-testid="input-payment-reference"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <FileUploader
          mode="multiple"
          filesToUpload={filesToUpload}
          existingFiles={existingFiles}
          onFilesChange={setFilesToUpload}
          maxSize={10 * 1024 * 1024}
          accept={{
            'image/*': ['.png', '.jpg', '.jpeg'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
          }}
          compressionPreset="document"
          onExistingFileDelete={onExistingFileDelete}
          emptyStateTitle="Sin archivos adjuntos"
          emptyStateDescription="Arrastra archivos o haz clic para seleccionar"
          newFileBadgeText="Nuevo"
        />
      </div>
    </div>
  )
}

function ViewPanel({
  existingPayment,
  attachments,
}: {
  existingPayment: any;
  attachments: any[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Cliente</h4>
          <div className="flex flex-col">
            <IdentityBadge
              name={existingPayment.client?.contact_full_name || 
                    existingPayment.client?.contact_company_name || 
                    `${existingPayment.client?.contact_first_name || ''} ${existingPayment.client?.contact_last_name || ''}`.trim() || 
                    '-'}
              avatarUrl={existingPayment.client?.linked_user_avatar_url || 
                        (existingPayment.client?.contact_image_bucket && existingPayment.client?.contact_image_path 
                          ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${existingPayment.client.contact_image_bucket}/${existingPayment.client.contact_image_path}`
                          : null)}
              size="sm"
              subLabel={existingPayment.client?.role_name}
            />
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Monto</h4>
          <span className="text-base font-bold text-green-700 dark:text-green-400" data-testid="text-payment-amount">
            {existingPayment.currency?.symbol} {existingPayment.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="text-xs text-muted-foreground mt-1">
            {existingPayment.currency?.code} - Tipo de cambio: {existingPayment.exchange_rate?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Fecha de Pago</h4>
          <span className="text-sm font-medium" data-testid="text-payment-date">
            {existingPayment.payment_date ? format(parseLocalDate(existingPayment.payment_date)!, 'dd/MM/yyyy', { locale: es }) : '-'}
          </span>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Billetera</h4>
          <span className="text-sm font-medium" data-testid="text-payment-wallet">
            {existingPayment.wallet?.wallets?.name || '-'}
          </span>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Estado</h4>
          {(() => {
            const statusConfig = getClientPaymentStatusBadgeConfig(existingPayment.status);
            return (
              <Badge variant={statusConfig.variant} className={statusConfig.className} data-testid="badge-payment-status">
                {statusConfig.label}
              </Badge>
            );
          })()}
        </div>
      </div>

      {(existingPayment.reference || existingPayment.commitment || existingPayment.schedule) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {existingPayment.reference && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Referencia</h4>
              <span className="text-sm" data-testid="text-payment-reference">{existingPayment.reference}</span>
            </div>
          )}
          {existingPayment.commitment && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Compromiso</h4>
              <span className="text-sm" data-testid="text-payment-commitment">
                {existingPayment.currency?.symbol} {existingPayment.commitment.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {existingPayment.schedule && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Cuota</h4>
              <span className="text-sm" data-testid="text-payment-schedule">
                Vencimiento: {format(parseLocalDate(existingPayment.schedule.due_date)!, 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          )}
        </div>
      )}

      {existingPayment.notes && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Notas</h4>
          <p className="text-sm bg-muted/30 p-3 rounded-md" data-testid="text-payment-notes">{existingPayment.notes}</p>
        </div>
      )}

      {attachments.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Archivos Adjuntos</h4>
          <div className="space-y-2">
            {attachments.map((attachment: any) => (
              <a
                key={attachment.id}
                href={attachment.media_file?.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                data-testid={`link-payment-attachment-${attachment.id}`}
              >
                <FileText className="h-4 w-4" />
                {attachment.media_file?.file_name || 'Archivo adjunto'}
                {attachment.description && (
                  <span className="text-xs text-muted-foreground">({attachment.description})</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div data-testid="text-payment-created-at">
            <span className="font-medium">Creado:</span> {format(new Date(existingPayment.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
          </div>
          {existingPayment.updated_at && existingPayment.updated_at !== existingPayment.created_at && (
            <div data-testid="text-payment-updated-at">
              <span className="font-medium">Actualizado:</span> {format(new Date(existingPayment.updated_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export interface ClientPaymentFormProps {
  projectId?: string;
  organizationId?: string;
  paymentId?: string;
  mode: 'create' | 'edit' | 'view';
  onSuccess: () => void;
  onCancel: () => void;
  hideActions?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function ClientPaymentForm({ 
  projectId, 
  organizationId, 
  paymentId, 
  mode, 
  onSuccess, 
  onCancel,
  hideActions = false,
  formRef
}: ClientPaymentFormProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const [filesToUpload, setFilesToUpload] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])

  const { data: existingPayment, isLoading: loadingPayment } = useClientPayment(
    paymentId,
    organizationId
  )

  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId || '')
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId)
  
  const [effectiveProjectId, setEffectiveProjectId] = useState<string | undefined>(projectId)
  
  const { data: projectClients, isLoading: clientsLoading } = useProjectClients(effectiveProjectId, organizationId)
  const { data: commitments, isLoading: commitmentsLoading } = useClientCommitments(effectiveProjectId, organizationId)
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId || '')
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId || '')

  const currentMember = useMemo(() => {
    return members.find(m => m.user_id === userData?.user?.id) || null
  }, [members, userData?.user?.id])

  const form = useForm<ClientPaymentFormData>({
    resolver: zodResolver(clientPaymentSchema),
    defaultValues: {
      payment_date: new Date(),
      created_by: '',
      project_id: projectId || '',
      client_id: '',
      commitment_id: undefined,
      wallet_id: '',
      amount: 0,
      currency_id: '',
      exchange_rate: undefined,
      status: 'confirmed',
      reference: '',
      notes: '',
    }
  })

  const isLoading = currenciesLoading || clientsLoading || walletsLoading || membersLoading || projectsLoading || ((mode === 'edit' || mode === 'view') && loadingPayment)

  const createPaymentMutation = useCreateClientPayment()
  const updatePaymentMutation = useUpdateClientPayment()

  const watchedProjectId = form.watch('project_id')
  React.useEffect(() => {
    if (watchedProjectId && watchedProjectId !== effectiveProjectId) {
      setEffectiveProjectId(watchedProjectId)
    }
  }, [watchedProjectId, effectiveProjectId])

  React.useEffect(() => {
    if (existingPayment && (mode === 'edit' || mode === 'view')) {
      const paymentDate = parseLocalDate(existingPayment.payment_date) || new Date()
      
      form.reset({
        payment_date: paymentDate,
        created_by: existingPayment.created_by || currentMember?.id || '',
        project_id: existingPayment.project_id || projectId || '',
        client_id: existingPayment.client_id || '',
        commitment_id: existingPayment.commitment_id || undefined,
        wallet_id: existingPayment.wallet_id || '',
        amount: existingPayment.amount || 0,
        currency_id: existingPayment.currency_id || '',
        exchange_rate: existingPayment.exchange_rate || undefined,
        status: existingPayment.status || 'confirmed',
        reference: existingPayment.reference || '',
        notes: existingPayment.notes || '',
      })
    }
  }, [existingPayment, mode, form, currentMember?.id, projectId])

  // Auto-populate created_by, default wallet, and default currency for CREATE mode
  React.useEffect(() => {
    if (mode === 'create') {
      if (currentMember?.id) {
        form.setValue('created_by', currentMember.id)
      }
      // Select default wallet if available
      const defaultWallet = wallets?.find(w => w.is_default)
      if (defaultWallet?.id) {
        form.setValue('wallet_id', defaultWallet.id)
      }
      // Select default currency if available
      const defaultCurrency = currencies?.find(c => c.is_default)
      if (defaultCurrency?.id) {
        form.setValue('currency_id', defaultCurrency.id)
      }
    }
  }, [mode, currentMember?.id, wallets, currencies, form])

  React.useEffect(() => {
    const fetchAttachments = async () => {
      if (!paymentId || !organizationId || !projectId) return
      
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        
        if (!token) {
          console.error('No auth token available for fetching attachments')
          return
        }
        
        const response = await fetch(
          `/api/projects/${projectId}/client-payments/${paymentId}/attachments?organization_id=${organizationId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        if (response.ok) {
          const result = await response.json()
          if (result.data) {
            setAttachments(result.data)
          }
        }
      } catch (error) {
        console.error('Error fetching payment attachments:', error)
      }
    }
    
    if (mode === 'edit' || mode === 'view') {
      fetchAttachments()
    }
  }, [paymentId, organizationId, projectId, mode])
  
  const existingFiles = useMemo(() => {
    if (!attachments || attachments.length === 0) return []
    
    return attachments.map((attachment: any) => ({
      id: attachment.id,
      file_name: attachment.media_file?.file_name || 'Archivo adjunto',
      file_type: attachment.media_file?.file_type || 'document',
      file_size: attachment.media_file?.file_size || 0,
      file_url: attachment.media_file?.file_url || '',
      isExisting: true,
    }))
  }, [attachments])

  const queryClient = useQueryClient()

  const handleExistingFileDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId, false)
      queryClient.invalidateQueries({ queryKey: ['client-payment-media', paymentId] })
      toast({
        title: 'Archivo eliminado',
        description: 'El archivo ha sido eliminado correctamente',
      })
    } catch (error: any) {
      toast({
        title: 'Error al eliminar archivo',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const isSubmitting = createPaymentMutation.isPending || updatePaymentMutation.isPending

  const onSubmit = async (data: ClientPaymentFormData) => {
    try {
      let paymentResult;
      
      if (mode === 'edit' && paymentId) {
        paymentResult = await updatePaymentMutation.mutateAsync({
          paymentId,
          updates: {
            client_id: data.client_id,
            commitment_id: data.commitment_id || null,
            wallet_id: data.wallet_id,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate || null,
            payment_date: formatDateForDB(data.payment_date),
            status: data.status,
            reference: data.reference || null,
            notes: data.notes || null,
          },
          organizationId: organizationId || '',
        })
      } else {
        paymentResult = await createPaymentMutation.mutateAsync({
          payment: {
            client_id: data.client_id,
            wallet_id: data.wallet_id,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate || null,
            payment_date: formatDateForDB(data.payment_date),
            status: data.status,
            reference: data.reference || null,
            notes: data.notes || null,
            commitment_id: data.commitment_id || null,
            schedule_id: null,
          },
          projectId: data.project_id || projectId || '',
          organizationId: organizationId || '',
          createdBy: data.created_by,
        })
      }

      const createdPaymentId = paymentResult?.id || paymentId
      
      if (filesToUpload.length > 0 && createdPaymentId) {
        if (!organizationId) {
          toast({
            variant: 'destructive',
            title: 'Error al subir archivos',
            description: 'No se encontró el ID de la organización.',
            duration: 8000,
          })
          return;
        }

        for (const fileInput of filesToUpload) {
          try {
            console.log('[ClientPaymentFormFields] Uploading file:', {
              fileName: fileInput.file?.name,
              fileSize: fileInput.file?.size,
              organizationId,
              projectId: data.project_id || projectId,
              createdPaymentId,
              createdByMemberId: currentMember?.id,
            })
            
            if (!fileInput.file) {
              console.error('[ClientPaymentFormFields] No file object in fileInput:', fileInput)
              continue
            }
            
            const uploadResult = await uploadFile(fileInput.file, {
              entity: 'client_payment_attachment',
              organization_id: organizationId,
              project_id: data.project_id || projectId,
              created_by_member_id: currentMember?.id,
              link_to: {
                client_payment_id: createdPaymentId,
              },
              category: 'document',
              description: fileInput.description || fileInput.file.name,
            })
            
            console.log('[ClientPaymentFormFields] Upload successful:', uploadResult)
          } catch (uploadError: any) {
            console.error('[ClientPaymentFormFields] Error uploading file:', {
              error: uploadError,
              message: uploadError?.message,
              code: uploadError?.code,
              details: uploadError?.details,
              hint: uploadError?.hint,
              stack: uploadError?.stack,
            })
            toast({
              variant: 'destructive',
              title: 'Error al subir archivo',
              description: uploadError?.message || String(uploadError) || 'Error desconocido',
              duration: 8000,
            })
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['client-payment-media', createdPaymentId] })
      setFilesToUpload([])
      
      toast({
        title: mode === 'edit' ? 'Pago actualizado' : 'Pago registrado',
        description: mode === 'edit'
          ? 'El pago ha sido actualizado correctamente'
          : 'El pago ha sido registrado correctamente',
      })
      form.reset()
      onSuccess()
    } catch (error: any) {
      console.error('Error saving payment:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${mode === 'edit' ? 'actualizar' : 'registrar'} el pago: ${error.message || 'Error desconocido'}`,
      })
    }
  }

  if (mode === 'view') {
    return (
      <div className="space-y-6 w-full">
        {existingPayment && (
          <ViewPanel
            existingPayment={existingPayment}
            attachments={attachments}
          />
        )}
        {!hideActions && (
          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="secondary" 
              onClick={onCancel}
              data-testid="button-payment-close"
            >
              Cerrar
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <FormPanel
          form={form}
          onSubmit={onSubmit}
          projectClients={projectClients || []}
          clientsLoading={clientsLoading}
          commitments={commitments || []}
          commitmentsLoading={commitmentsLoading}
          currencies={currencies || []}
          currenciesLoading={currenciesLoading}
          wallets={wallets || []}
          walletsLoading={walletsLoading}
          projects={projects}
          projectsLoading={projectsLoading}
          projectId={projectId}
          isLoading={isLoading}
          filesToUpload={filesToUpload}
          setFilesToUpload={setFilesToUpload}
          existingFiles={existingFiles}
          onExistingFileDelete={handleExistingFileDelete}
        />
        
        {!hideActions && (
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onCancel} 
              className="flex-1"
              data-testid="button-payment-cancel"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !currentMember || isLoading} 
              className="flex-[3]"
              data-testid="button-payment-submit"
            >
              {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Guardar Cambios' : 'Registrar Pago'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}

export default ClientPaymentForm
