import imageCompression from 'browser-image-compression';

export type ImagePreset = 
  | 'project-cover'
  | 'sitelog-photo' 
  | 'course-cover'
  | 'avatar'
  | 'document'
  | 'default';

interface CompressionPreset {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  quality: number;
  preserveExif: boolean;
}

const PRESETS: Record<ImagePreset, CompressionPreset> = {
  'project-cover': {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    quality: 0.85,
    preserveExif: false
  },
  'sitelog-photo': {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1280,
    quality: 0.80,
    preserveExif: false
  },
  'course-cover': {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    quality: 0.90,
    preserveExif: false
  },
  'avatar': {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 512,
    quality: 0.90,
    preserveExif: false
  },
  'document': {
    maxSizeMB: 2,
    maxWidthOrHeight: 2048,
    quality: 0.85,
    preserveExif: true
  },
  'default': {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    quality: 0.85,
    preserveExif: false
  }
};

export function shouldCompress(file: File): boolean {
  // Don't compress GIFs - preserve animation
  if (file.type === 'image/gif') {
    return false;
  }
  return file.type.startsWith('image/');
}

export async function compressImage(
  file: File,
  preset: ImagePreset = 'default'
): Promise<File> {
  if (!shouldCompress(file)) {
    return file;
  }

  const presetConfig = PRESETS[preset];
  const originalSizeKB = file.size / 1024;
  const originalSizeMB = originalSizeKB / 1024;

  try {
    const compressedBlob = await imageCompression(file, {
      maxSizeMB: presetConfig.maxSizeMB,
      maxWidthOrHeight: presetConfig.maxWidthOrHeight,
      useWebWorker: true,
      initialQuality: presetConfig.quality,
      preserveExif: presetConfig.preserveExif
    });

    // Ensure the compressed result is a File with the original name preserved
    // browser-image-compression may return a Blob without the name property
    const compressedFile = new File(
      [compressedBlob], 
      file.name, 
      { type: compressedBlob.type || file.type }
    );

    return compressedFile;
  } catch (error) {
    console.error('[compressImage] Error compressing image:', error);
    return file;
  }
}

export function formatCompressionStats(originalSize: number, compressedSize: number): string {
  const originalMB = (originalSize / (1024 * 1024)).toFixed(2);
  const compressedMB = (compressedSize / (1024 * 1024)).toFixed(2);
  const reductionPercent = (((originalSize - compressedSize) / originalSize) * 100).toFixed(0);
  
  return `Imagen optimizada: ${originalMB}MB → ${compressedMB}MB (${reductionPercent}% reducción)`;
}
