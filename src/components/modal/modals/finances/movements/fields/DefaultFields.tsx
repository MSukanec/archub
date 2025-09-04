import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormSubsectionButton } from '@/components/modal/form/FormSubsectionButton'
import { CurrencyAmountField } from '@/components/ui-custom/fields/CurrencyAmountField'
import { Package, Users, Folder } from 'lucide-react'
import ProjectSelectorField from '@/components/ui-custom/fields/ProjectSelectorField'
import { UseFormReturn } from 'react-hook-form'
import { PersonnelFields } from './PersonnelFields'
import { SubcontractsFields } from './SubcontractsFields'
import { ClientsFields } from './ClientsFields'
import { IndirectFields } from './IndirectFields'
import { PartnerWithdrawalsFields } from './PartnerWithdrawalsFields'
import { PartnerContributionsFields } from './PartnerContributionsFields'
import { CommitmentItem } from './ClientsFields'

interface DefaultFieldsProps {
  form: UseFormReturn<any>
  currencies: any[]
  wallets: any[]
  // Props para campos integrados
  selectedCategoryId?: string
  selectedPersonnel?: Array<{personnel_id: string, contact_name: string}>
  selectedSubcontracts?: Array<{subcontract_id: string, contact_name: string}>
  selectedClients?: CommitmentItem[]
  selectedIndirects?: Array<{indirect_id: string, indirect_name: string}>
  selectedPartnerWithdrawals?: Array<{partner_id: string, partner_name: string}>
  selectedPartnerContributions?: Array<{partner_id: string, partner_name: string}>
  onPersonnelChange?: (personnelList: Array<{personnel_id: string, contact_name: string}>) => void
  onSubcontractsChange?: (subcontractsList: Array<{subcontract_id: string, contact_name: string}>) => void
  onClientsChange?: (clientsList: CommitmentItem[]) => void
  onIndirectsChange?: (indirectsList: Array<{indirect_id: string, indirect_name: string}>) => void
  onPartnerWithdrawalsChange?: (partnerWithdrawalsList: Array<{partner_id: string, partner_name: string}>) => void
  onPartnerContributionsChange?: (partnerContributionsList: Array<{partner_id: string, partner_name: string}>) => void
  // Props para el selector de proyecto
  projects?: any[]
  isOrganizationalContext?: boolean
  // Props opcionales para botones específicos (mantenidas para compatibilidad)
  showPersonButton?: boolean
  showTaskButton?: boolean
  showSubcontractButton?: boolean
  selectedPersonId?: string | null
  selectedTaskId?: string | null
  selectedSubcontractId?: string | null
  onOpenPersonSubform?: () => void
  onOpenTasksSubform?: () => void
  onOpenSubcontractSubform?: () => void
}

export function DefaultMovementFields({
  form,
  currencies,
  wallets,
  selectedCategoryId,
  selectedPersonnel = [],
  selectedSubcontracts = [],
  selectedClients = [],
  selectedIndirects = [],
  selectedPartnerWithdrawals = [],
  selectedPartnerContributions = [],
  onPersonnelChange,
  onSubcontractsChange,
  onClientsChange,
  onIndirectsChange,
  onPartnerWithdrawalsChange,
  onPartnerContributionsChange,
  projects = [],
  isOrganizationalContext = false,
  showPersonButton = false,
  showTaskButton = false,
  showSubcontractButton = false,
  selectedPersonId = null,
  selectedTaskId = null,
  selectedSubcontractId = null,
  onOpenPersonSubform,
  onOpenTasksSubform,
  onOpenSubcontractSubform
}: DefaultFieldsProps) {
  return (
    <>
      {/* CAMPO MONEDA ORIGINAL COMENTADO TEMPORALMENTE */}
      {/*
      <FormField
        control={form.control}
        name="currency_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Moneda *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {currencies?.map((orgCurrency) => (
                  <SelectItem key={orgCurrency.currency?.id} value={orgCurrency.currency?.id || ''}>
                    {orgCurrency.currency?.name || 'Sin nombre'} ({orgCurrency.currency?.symbol || '$'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      */}

      {/* Fila: Billetera | Moneda y Monto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 col-span-2">
        <FormField
          control={form.control}
          name="wallet_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billetera *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {wallets?.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.wallets?.name || 'Sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Moneda y Monto *</FormLabel>
          <FormControl>
            <CurrencyAmountField
              value={form.watch('amount') || undefined}
              currency={form.watch('currency_id') || ''}
              currencies={currencies?.map(orgCurrency => ({
                id: orgCurrency.currency?.id || '',
                name: orgCurrency.currency?.name || 'Sin nombre',
                symbol: orgCurrency.currency?.symbol || '$'
              })) || []}
              onValueChange={(value) => {
                form.setValue('amount', value || 0)
              }}
              onCurrencyChange={(currencyId) => {
                form.setValue('currency_id', currencyId)
              }}
              placeholder="0.00"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </div>

      {/* Fila: Cotización (ancho completo) */}
      <div className="col-span-2">
        <FormField
          control={form.control}
          name="exchange_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cotización (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Ej: 1.0000"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Botón para Selección de Persona - Solo si showPersonButton es true */}
      {showPersonButton && onOpenPersonSubform && (
        <div className="col-span-2">
          <FormSubsectionButton
            icon={<Users />}
            title="Seleccionar Persona"
            description={selectedPersonId ? "Persona seleccionada" : "Selecciona la persona relacionada con este movimiento"}
            onClick={onOpenPersonSubform}
          />
        </div>
      )}

      {/* Botón para Selección de Tareas - Solo si showTaskButton es true */}
      {showTaskButton && onOpenTasksSubform && (
        <div className="col-span-2">
          <FormSubsectionButton
            icon={<Package />}
            title="Seleccionar Tarea de Construcción"
            description={selectedTaskId ? "Tarea seleccionada" : "Selecciona la tarea relacionada con este movimiento"}
            onClick={onOpenTasksSubform}
          />
        </div>
      )}

      {/* Botón para Selección de Subcontrato - Solo si showSubcontractButton es true */}
      {showSubcontractButton && onOpenSubcontractSubform && (
        <div className="col-span-2">
          <FormSubsectionButton
            icon={<Package />}
            title="Configurar Subcontrato"
            description={selectedSubcontractId ? "Subcontrato configurado" : "Configura el subcontrato relacionado con este pago"}
            onClick={onOpenSubcontractSubform}
          />
        </div>
      )}

      {/* CAMPOS ESPECÍFICOS SEGÚN CATEGORÍA */}
      {selectedCategoryId === 'd376d404-734a-47a9-b851-d112d64147db' && onPersonnelChange && (
        <div className="col-span-2">
          <PersonnelFields 
            selectedPersonnel={selectedPersonnel}
            onPersonnelChange={onPersonnelChange}
            projectId={form.watch('project_id')}
          />
        </div>
      )}

      {selectedCategoryId === 'f40a8fda-69e6-4e81-bc8a-464359cd8498' && onSubcontractsChange && (
        <div className="col-span-2">
          <SubcontractsFields 
            selectedSubcontracts={selectedSubcontracts}
            onSubcontractsChange={onSubcontractsChange}
            projectId={form.watch('project_id')}
          />
        </div>
      )}

      {selectedCategoryId === 'f3b96eda-15d5-4c96-ade7-6f53685115d3' && onClientsChange && (
        <div className="col-span-2">
          <ClientsFields 
            selectedClients={selectedClients}
            onClientsChange={onClientsChange}
            projectId={form.watch('project_id')}
          />
        </div>
      )}

      {selectedCategoryId === 'e854de08-da8f-4769-a2c5-b24b622f20b0' && onIndirectsChange && (
        <div className="col-span-2">
          <IndirectFields 
            selectedIndirects={selectedIndirects}
            onIndirectsChange={onIndirectsChange}
            projectId={form.watch('project_id')}
          />
        </div>
      )}

      {form.watch('subcategory_id') === 'c04a82f8-6fd8-439d-81f7-325c63905a1b' && onPartnerWithdrawalsChange && (
        <div className="col-span-2">
          <PartnerWithdrawalsFields 
            selectedPartnerWithdrawals={selectedPartnerWithdrawals}
            onPartnerWithdrawalsChange={onPartnerWithdrawalsChange}
          />
        </div>
      )}

      {form.watch('subcategory_id') === 'a0429ca8-f4b9-4b91-84a2-b6603452f7fb' && onPartnerContributionsChange && (
        <div className="col-span-2">
          <PartnerContributionsFields 
            selectedPartnerContributions={selectedPartnerContributions}
            onPartnerContributionsChange={onPartnerContributionsChange}
          />
        </div>
      )}

    </>
  )
}