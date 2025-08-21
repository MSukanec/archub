import React from 'react'

interface ContactAttachmentsSubformProps {
  contactId: string;
  contact: any;
}

export function ContactAttachmentsSubform({ contactId, contact }: ContactAttachmentsSubformProps) {
  return (
    <div className="space-y-6">
      <div className="text-center text-muted-foreground">
        <p>La funcionalidad de archivos adjuntos estará disponible próximamente.</p>
      </div>
    </div>
  )
}