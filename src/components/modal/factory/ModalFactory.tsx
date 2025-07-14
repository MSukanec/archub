import React from 'react';
import { GalleryFormModal } from './GalleryFormModal';
import { useGlobalModalStore } from './useGlobalModalStore';

// TODO: Replace these placeholders with actual modals when they exist
const PlaceholderModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => null;
const MovementModal = PlaceholderModal;
const BitacoraModal = PlaceholderModal;  
const ContactModal = PlaceholderModal;

export function ModalFactory() {
  const { open, type, data, closeModal } = useGlobalModalStore();

  if (!open || !type) return null;

  console.log('ModalFactory rendering:', { open, type, data });

  switch (type) {
    case 'movement':
      return <MovementModal open={open} onClose={closeModal} data={data} />;
    case 'bitacora':
      return <BitacoraModal open={open} onClose={closeModal} data={data} />;
    case 'contact':
      return <ContactModal open={open} onClose={closeModal} data={data} />;
    case 'gallery':
      console.log('Rendering GalleryFormModal with props:', { open, editingFile: data?.editingFile });
      return <GalleryFormModal open={open} onClose={closeModal} editingFile={data?.editingFile} />;
    default:
      return null;
  }
}