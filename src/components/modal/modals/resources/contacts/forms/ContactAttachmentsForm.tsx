import React from 'react'
import { ContactAttachmentsPanel } from '@/components/contacts/ContactAttachmentsPanel'

interface ContactAttachmentsFormProps {
  contactId: string;
  contact: any;
}

export function ContactAttachmentsForm({ contactId, contact }: ContactAttachmentsFormProps) {
  return (
    <div className="space-y-6">
      <ContactAttachmentsPanel 
        contactId={contactId} 
        contact={contact}
        showUpload={true}
      />
    </div>
  )
}