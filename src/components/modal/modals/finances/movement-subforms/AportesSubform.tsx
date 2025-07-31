import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { AportesFields } from '../movement-forms/AportesFields'

interface AportesSubformProps {
  form: UseFormReturn<any>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
  projectClients: any[]
  movement?: any
}

export function AportesSubform({
  form,
  currencies,
  wallets,
  members,
  concepts,
  projectClients,
  movement
}: AportesSubformProps) {
  return (
    <div className="space-y-4">
      <AportesFields
        form={form}
        currencies={currencies}
        wallets={wallets}
        members={members}
        concepts={concepts}
        projectClients={projectClients}
        movement={movement}
      />
    </div>
  )
}