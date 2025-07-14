import React from 'react';
import { TestFormModal } from '@/components/modal/form/TestFormModal';
import { useGlobalModalStore } from './useGlobalModalStore';

// Placeholders for future modals - replace with actual imports when they exist
const MovementModal = TestFormModal; // Using TestFormModal as placeholder
const BitacoraModal = TestFormModal; // Using TestFormModal as placeholder  
const ContactModal = TestFormModal; // Using TestFormModal as placeholder

export function ModalFactory() {
  const { open, type, data, closeModal } = useGlobalModalStore();

  if (!open || !type) return null;

  switch (type) {
    case 'movement':
      return <MovementModal open={open} onClose={closeModal} data={data} />;
    case 'bitacora':
      return <BitacoraModal open={open} onClose={closeModal} data={data} />;
    case 'contact':
      return <ContactModal open={open} onClose={closeModal} data={data} />;
    default:
      return null;
  }
}