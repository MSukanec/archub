import React from 'react'
import { ContactAttachmentsPanel } from '@/features/contacts'

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