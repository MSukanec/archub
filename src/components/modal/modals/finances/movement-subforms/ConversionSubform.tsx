import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ConversionFields } from '../movement-forms/ConversionFields'

interface ConversionSubformProps {
  form: UseFormReturn<any>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
  movement?: any
}

export function ConversionSubform({
  form,
  currencies,
  wallets,
  members,
  concepts,
  movement
}: ConversionSubformProps) {
  return (
    <div className="space-y-4">
      <ConversionFields
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