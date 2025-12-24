import { UserPlus, Eye, Edit } from "lucide-react";
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from "@/components/modal";
import { useGlobalModalStore } from "@/components/modal";
import { 
  FormPanel, 
  ViewPanel, 
  useContactForm,
  type Contact 
} from '../forms/ContactForm';

interface ContactModalProps {
  modalData?: {
    contactId?: string;
    contact?: Contact;
  };
  onClose: () => void;
  mode?: "create" | "edit" | "view";
}

export function ContactModal({ modalData, onClose, mode: modeProp }: ContactModalProps) {
  const { openModal } = useGlobalModalStore();
  
  const contactId = modalData?.contactId;
  const contact = modalData?.contact;
  const mode = modeProp || 'create';

  const {
    form,
    onSubmit,
    editingContact,
    contactTypes,
    foundUser,
    isAlreadyMember,
    inviteMemberMutation,
    handleAvatarUpload,
    avatarUploading,
    filesToUpload,
    setFilesToUpload,
    currentAvatarUrl,
    handleShare,
    isSubmitting,
    contactLoading,
  } = useContactForm({
    contactId,
    contact,
    mode,
    onSuccess: onClose,
  });

  const getHeader = () => {
    switch (mode) {
      case "view":
        return { 
          title: editingContact?.full_name || `${editingContact?.first_name || ''} ${editingContact?.last_name || ''}`.trim() || 'Sin nombre',
          description: "Información del contacto"
        };
      case "edit":
        return { 
          title: "Editar Contacto", 
          description: "Actualiza la información del contacto" 
        };
      case "create":
      default:
        return { 
          title: "Nuevo Contacto", 
          description: "Agrega un nuevo contacto a tu organización" 
        };
    }
  };

  const header = getHeader();

  if ((mode === "edit" || mode === "view") && contactLoading) {
    return (
      <ModalLayout onClose={onClose} size="md">
        <ModalHeader title="Cargando contacto..." />
        <ModalBody>
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-8 bg-muted rounded animate-pulse" />
          </div>
        </ModalBody>
      </ModalLayout>
    );
  }

  if (mode === "view" && !editingContact) {
    return (
      <ModalLayout onClose={onClose} size="md">
        <ModalHeader title="Contacto no encontrado" />
        <ModalBody>
          <p className="text-muted-foreground">No se pudo cargar el contacto.</p>
        </ModalBody>
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={onClose}
        />
      </ModalLayout>
    );
  }

  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader 
        title={header.title}
        description={header.description}
        icon={mode === "view" ? Eye : mode === "edit" ? Edit : UserPlus}
      />
      
      <ModalBody>
        {mode === "view" && editingContact && contactId && !contactLoading ? (
          <ViewPanel
            contact={editingContact}
            contactAvatarUrl={currentAvatarUrl}
            existingFiles={[]}
            handleShare={handleShare}
            inviteMemberMutation={inviteMemberMutation}
            isAlreadyMember={isAlreadyMember}
          />
        ) : (
          <FormPanel
            form={form}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            contact={editingContact}
            contactTypes={contactTypes}
            foundUser={foundUser}
            isAlreadyMember={isAlreadyMember}
            inviteMemberMutation={inviteMemberMutation}
            onAvatarChange={handleAvatarUpload}
            avatarUploading={avatarUploading}
            filesToUpload={filesToUpload}
            setFilesToUpload={setFilesToUpload}
            currentAvatarUrl={currentAvatarUrl}
          />
        )}
      </ModalBody>

      {mode !== "view" && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={mode === "create" ? "Crear Contacto" : "Actualizar Contacto"}
          onSubmit={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          data-testid="button-submit-contact"
        />
      )}

      {mode === "view" && (
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={onClose}
          submitText="Editar"
          onSubmit={() => openModal('contact', { contactId: editingContact?.id, mode: 'edit' })}
          data-testid="button-edit-from-view"
        />
      )}
    </ModalLayout>
  );
}
