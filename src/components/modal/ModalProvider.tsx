import { useEffect } from 'react';
import { useGlobalModalStore, useModalStack } from './state/globalModalStore';
import { getModal } from './factory/registry';
import { ModalContainer } from './ModalContainer';
import { initializeModalRegistry } from './factory/registerModals';

initializeModalRegistry();

export function ModalProvider() {
  const stack = useModalStack();
  const { blockCloseForDirtyForms, popModal } = useGlobalModalStore();

  useEffect(() => {
    if (stack.length > 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [stack.length]);

  useEffect(() => {
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        
        const topModal = stack[stack.length - 1];
        const entry = getModal(topModal.type);
        
        if (entry?.config.preventCloseOnEsc) {
          return;
        }
        
        if (blockCloseForDirtyForms) {
          return;
        }
        
        popModal();
      }
    };

    document.addEventListener('keydown', handleGlobalEsc, true);
    return () => document.removeEventListener('keydown', handleGlobalEsc, true);
  }, [stack, blockCloseForDirtyForms, popModal]);

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((modal, index) => {
        const entry = getModal(modal.type);
        
        if (!entry) {
          console.warn(`Modal type "${modal.type}" not found in registry`);
          return null;
        }

        const zIndex = 50 + index * 10;

        return (
          <ModalContainer
            key={modal.id}
            entry={entry}
            modal={modal}
            zIndex={zIndex}
            stackIndex={index}
          />
        );
      })}
    </>
  );
}

export default ModalProvider;
