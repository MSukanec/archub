import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import 'yet-another-react-lightbox/styles.css';

export interface MediaItem {
  type: 'image' | 'video';
  src: string;
}

interface MediaLightboxProps {
  media: MediaItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaLightbox({
  media,
  currentIndex,
  isOpen,
  onClose
}: MediaLightboxProps) {
  if (!isOpen || media.length === 0) {
    return null;
  }

  const slides = media.map((item) => {
    if (item.type === 'video') {
      return {
        type: 'video' as const,
        sources: [
          {
            src: item.src,
            type: 'video/mp4',
          },
        ],
      };
    }
    return {
      src: item.src,
    };
  });

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={slides}
      index={currentIndex}
      plugins={[Video]}
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

// Hook para facilitar el uso del lightbox con imágenes y videos
export function useMediaLightbox(media: MediaItem[]) {
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

// Mantener compatibilidad con el hook anterior (solo imágenes)
export function useImageLightbox(images: string[] = []) {
  const media = images.map(src => ({ type: 'image' as const, src }));
  return useMediaLightbox(media);
}

// Componente wrapper para compatibilidad con arrays de strings
interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  images = [],
  currentIndex,
  isOpen,
  onClose
}: ImageLightboxProps) {
  const media = images.map(src => ({ type: 'image' as const, src }));
  
  return (
    <MediaLightbox
      media={media}
      currentIndex={currentIndex}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}