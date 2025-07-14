import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose
}: ImageLightboxProps) {
  if (!isOpen || images.length === 0) {
    return null;
  }

  const slides = images.map((image) => ({
    src: image,
  }));

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={slides}
      index={currentIndex}
      styles={{
        container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
      }}
      controller={{
        closeOnPullDown: true,
        closeOnBackdropClick: true,
      }}
    />
  );
}

// Hook para facilitar el uso del lightbox
export function useImageLightbox(images: string[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number = 0) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const closeLightbox = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    currentIndex,
    openLightbox,
    closeLightbox
  };
}