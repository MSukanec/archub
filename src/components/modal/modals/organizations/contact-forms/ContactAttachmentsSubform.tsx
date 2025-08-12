import React from 'react'
import { ContactAttachmentsPanel } from '@/components/contacts/ContactAttachmentsPanel'

interface ContactAttachmentsSubformProps {
  contactId: string
  contact: any
}

export function ContactAttachmentsSubform({ contactId, contact }: ContactAttachmentsSubformProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Archivos y Media</h3>
        <p className="text-sm text-muted-foreground">
          Gestiona los archivos adjuntos y multimedia del contacto
        </p>
      </div>
      
      <ContactAttachmentsPanel 
        contactId={contactId} 
        contact={contact}
      />
    </div>
  )
}