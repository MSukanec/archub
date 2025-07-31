import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { TransferFields } from '../movement-forms/TransferFields'

interface TransferSubformProps {
  form: UseFormReturn<any>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
  movement?: any
}

export function TransferSubform({
  form,
  currencies,
  wallets,
  members,
  concepts,
  movement
}: TransferSubformProps) {
  return (
    <div className="space-y-4">
      <TransferFields
        form={form}
        currencies={currencies}
        wallets={wallets}
        members={members}
        concepts={concepts}
        movement={movement}
      />
    </div>
  )
}