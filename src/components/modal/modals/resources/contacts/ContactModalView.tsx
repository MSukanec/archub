import React from 'react'
import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2, Phone, Mail, Share2, Building, MapPin, Globe, User, FileText } from 'lucide-react'
import { ContactAttachmentsPanel } from '@/components/contacts/ContactAttachmentsPanel'
import { cn } from '@/lib/utils'

interface ContactModalViewProps {
  modalData?: {
    viewingContact?: any;
  };
  onClose: () => void;
  onEdit?: (contact: any) => void;
  onDelete?: (contact: any) => void;
}

export function ContactModalView({ modalData, onClose, onEdit, onDelete }: ContactModalViewProps) {
  const contact = modalData?.viewingContact
  const { openModal } = useGlobalModalStore()
  
  if (!contact) {
    return null
  }

  // Handler para abrir el modal de edición
  const handleEdit = () => {
    onClose() // Cerrar el modal de vista primero
    openModal('contact', { editingContact: contact, isEditing: true })
  }

  // Helpers para acciones rápidas
  const handleCall = () => {
    if (contact.phone) {
      window.open(`tel:${contact.phone}`, '_self')
    }
  }
  
  const handleEmail = () => {
    if (contact.email) {
      window.open(`mailto:${contact.email}`, '_self')
    }
  }
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Contacto: ${getDisplayName()}`,
        text: `${getDisplayName()}${contact.email ? `\nEmail: ${contact.email}` : ''}${contact.phone ? `\nTeléfono: ${contact.phone}` : ''}`,
      })
    }
  }

  // Determinar nombre para mostrar
  const getDisplayName = () => {
    return contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Sin nombre'
  }

  // Obtener iniciales para avatar
  const getInitials = () => {
    const name = getDisplayName()
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const displayName = getDisplayName()
  const avatarUrl = contact.linked_user?.avatar_url || ""

  const viewPanel = (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center pt-4 pb-6">
        {/* Avatar grande */}
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            {avatarUrl && avatarUrl.trim() !== '' && (
              <AvatarImage 
                src={avatarUrl} 
                alt={`Avatar de ${displayName}`}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-2xl font-bold bg-accent text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Nombre */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {displayName}
        </h2>

        {/* Tipos de contacto debajo del nombre */}
        {contact.contact_types && contact.contact_types.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {contact.contact_types.map((type: any) => (
              <Badge
                key={type.id}
                className="bg-accent text-white"
              >
                {type.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Badge de Usuario de Archub si está vinculado */}
        {contact.linked_user && (
          <div className="flex items-center justify-center gap-1 mb-4">
            <User className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Usuario de Archub</span>
          </div>
        )}

        {/* Botones de acción rápida */}
        <div className="flex justify-center gap-3">
          {contact.phone && (
            <Button
              variant="default"
              size="icon"
              onClick={handleCall}
              className="h-10 w-10"
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          
          {contact.email && (
            <Button
              variant="default"
              size="icon"
              onClick={handleEmail}
              className="h-10 w-10"
            >
              <Mail className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="default"
            size="icon"
            onClick={handleShare}
            className="h-10 w-10"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Información de contacto */}
      <div className="grid grid-cols-1 gap-4">
        {contact.email && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Mail className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-sm truncate" title={contact.email}>
                {contact.email}
              </p>
            </div>
          </div>
        )}

        {contact.phone && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Phone className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <p className="font-medium text-sm truncate" title={contact.phone}>
                {contact.phone}
              </p>
            </div>
          </div>
        )}

        {contact.company_name && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Building className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Empresa</p>
              <p className="font-medium text-sm truncate" title={contact.company_name}>
                {contact.company_name}
              </p>
            </div>
          </div>
        )}

        {contact.location && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <div className="p-2 bg-accent/10 rounded-lg">
              <MapPin className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Ubicación</p>
              <p className="font-medium text-sm truncate" title={contact.location}>
                {contact.location}
              </p>
            </div>
          </div>
        )}

        {contact.country && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Globe className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">País</p>
              <p className="font-medium text-sm truncate" title={contact.country}>
                {contact.country}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notas */}
      {contact.notes && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Notas
          </h3>
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-sm text-foreground leading-relaxed">
              {contact.notes}
            </p>
          </div>
        </div>
      )}

      {/* Archivos y Media */}
      <div>
        <ContactAttachmentsPanel 
          contactId={contact.id} 
          contact={contact}
          showUpload={false}
        />
      </div>
    </div>
  )

  const headerContent = (
    <FormModalHeader
      title="Detalle del Contacto"
      description="Información completa del contacto"
      icon={User}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cerrar"
      onLeftClick={onClose}
      rightLabel="Editar Contacto"
      onRightClick={handleEdit}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  )
}