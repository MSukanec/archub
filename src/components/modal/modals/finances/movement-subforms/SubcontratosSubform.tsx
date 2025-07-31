import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { SubcontratosFields } from '../movement-forms/SubcontratosFields'

interface SubcontratosSubformProps {
  form: UseFormReturn<any>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
  projectClients: any[]
  constructionTasks: any[]
  subcontracts: any[]
  movement?: any
}

export function SubcontratosSubform({
  form,
  currencies,
  wallets,
  members,
  concepts,
  projectClients,
  constructionTasks,
  subcontracts,
  movement
}: SubcontratosSubformProps) {
  return (
    <div className="space-y-4">
      <SubcontratosFields
        form={form}
        currencies={currencies}
        wallets={wallets}
        members={members}
        concepts={concepts}
        projectClients={projectClients}
        constructionTasks={constructionTasks}
        subcontracts={subcontracts}
        movement={movement}
      />
    </div>
  )
}