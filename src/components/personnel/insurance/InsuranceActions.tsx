import React from 'react'
import { Button } from '@/components/ui/button'
import { Edit, RotateCcw, Trash2 } from 'lucide-react'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteInsurance } from '@/hooks/useInsurances'
import { InsuranceStatusRow } from '@/services/insurances'

interface InsuranceActionsProps {
  insurance: InsuranceStatusRow
}

export function InsuranceActions({ insurance }: InsuranceActionsProps) {
  const { openModal } = useGlobalModalStore()
  const deleteInsurance = useDeleteInsurance()

  const handleEdit = () => {
    openModal('insurance', { 
      insurance,
      mode: 'edit'
    })
  }

  const handleRenew = () => {
    openModal('renew-insurance', { 
      previous: insurance
    })
  }

  const handleDelete = () => {
    openModal('delete-confirmation', {
      title: 'Eliminar Seguro',
      message: `¿Estás seguro de que deseas eliminar el seguro ${insurance.insurance_type} de ${insurance.contact.first_name} ${insurance.contact.last_name}?`,
      onConfirm: () => deleteInsurance.mutate(insurance.id)
    })
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleEdit}
        className=""
      >
        <Edit className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleRenew}
        className=""
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleDelete}
        className=" text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}