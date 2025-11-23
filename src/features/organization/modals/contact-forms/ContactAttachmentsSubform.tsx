import React from 'react'
import { ContactAttachmentsPanel } from '@/components/contacts/ContactAttachmentsPanel'

interface ContactAttachmentsSubformProps {
  contactId: string
  contact: any
}

export function ContactAttachmentsSubform({ contactId, contact }: ContactAttachmentsSubformProps) {
  return (
    <ContactAttachmentsPanel 
      contactId={contactId} 
      contact={contact}
    />
  )
}