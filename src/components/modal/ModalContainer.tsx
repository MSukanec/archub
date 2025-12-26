import { useEffect, useState } from 'react';
import { ModalRegistryEntry } from './factory/registry';
import { ModalStackItem, useGlobalModalStore } from './state/globalModalStore';
import { DrawerBase } from './foundation/DrawerBase';
interface ModalContainerProps {
  entry: ModalRegistryEntry;
  modal: ModalStackItem;
  zIndex: number;
  stackIndex: number;
}
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}
export function ModalContainer({ entry, modal, zIndex, stackIndex }: ModalContainerProps) {
  const { popModal, blockCloseForDirtyForms } = useGlobalModalStore();
  const isMobile = useIsMobile();
  const { component: Component, config } = entry;
  const handleClose = () => {
    if (blockCloseForDirtyForms) {
      return;
    }
    popModal();
  };
  const mappedProps = config.mapDataToProps 
    ? config.mapDataToProps(modal.data)
    : {};
  const modalProps = {
    modalData: modal.data,
    onClose: handleClose,
    ...mappedProps,
  };
  const shouldUseDrawer = isMobile && config.drawerOnMobile;
  if (shouldUseDrawer) {
    return (
      <DrawerBase
        isOpen={true}
        onClose={handleClose}
        zIndex={zIndex}
        preventCloseOnBackdrop={config.preventCloseOnBackdrop}
        dismissible={!config.preventCloseOnBackdrop && !blockCloseForDirtyForms}
      >
        <Component {...modalProps} />
      </DrawerBase>
    );
  }
  return (
    <div style={{ position: 'relative', zIndex }}>
      <Component {...modalProps} />
    </div>
  );
}
