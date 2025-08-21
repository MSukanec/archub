import React from 'react'

interface ContactAttachmentsFormProps {
  contactId: string;
  contact: any;
}

export function ContactAttachmentsForm({ contactId, contact }: ContactAttachmentsFormProps) {
  return (
    <div className="space-y-6">
      <div className="text-center text-muted-foreground">
        <p>La funcionalidad de archivos adjuntos estará disponible próximamente.</p>
      </div>
    </div>
  )
}