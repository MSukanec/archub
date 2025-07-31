import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { MaterialesFields } from '../movement-forms/MaterialesFields'

interface MaterialesSubformProps {
  form: UseFormReturn<any>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
  constructionTasks: any[]
  movement?: any
}

export function MaterialesSubform({
  form,
  currencies,
  wallets,
  members,
  concepts,
  constructionTasks,
  movement
}: MaterialesSubformProps) {
  return (
    <div className="space-y-4">
      <MaterialesFields
        form={form}
        currencies={currencies}
        wallets={wallets}
        members={members}
        concepts={concepts}
        constructionTasks={constructionTasks}
        movement={movement}
      />
    </div>
  )
}