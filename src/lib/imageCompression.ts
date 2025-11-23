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
  return file.type.startsWith('image/');
}

export async function compressImage(
  file: File,
  preset: ImagePreset = 'default'
): Promise<File> {
  if (!shouldCompress(file)) {
    console.log('[Image Compression] Skipping non-image file:', file.name);
    return file;
  }

  const presetConfig = PRESETS[preset];
  const originalSizeKB = file.size / 1024;
  const originalSizeMB = originalSizeKB / 1024;

  try {
    console.log('[Image Compression] Starting compression...');
    console.log('  - File:', file.name);
    console.log('  - Preset:', preset);
    console.log('  - Original size:', originalSizeMB.toFixed(2), 'MB');
    console.log('  - Target max size:', presetConfig.maxSizeMB, 'MB');
    console.log('  - Max dimensions:', presetConfig.maxWidthOrHeight, 'px');
    console.log('  - Quality:', (presetConfig.quality * 100).toFixed(0), '%');

    const compressedFile = await imageCompression(file, {
      maxSizeMB: presetConfig.maxSizeMB,
      maxWidthOrHeight: presetConfig.maxWidthOrHeight,
      useWebWorker: true,
      initialQuality: presetConfig.quality,
      preserveExif: presetConfig.preserveExif
    });

    const compressedSizeKB = compressedFile.size / 1024;
    const compressedSizeMB = compressedSizeKB / 1024;
    const reductionPercent = ((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100;

    console.log('[Image Compression] Compression complete!');
    console.log('  - Compressed size:', compressedSizeMB.toFixed(2), 'MB');
    console.log('  - Reduction:', reductionPercent.toFixed(1), '%');
    console.log('  - Saved:', (originalSizeMB - compressedSizeMB).toFixed(2), 'MB');

    return compressedFile;
  } catch (error) {
    console.error('[Image Compression] Compression failed:', error);
    console.log('[Image Compression] Using original file');
    return file;
  }
}

export function formatCompressionStats(originalSize: number, compressedSize: number): string {
  const originalMB = (originalSize / (1024 * 1024)).toFixed(2);
  const compressedMB = (compressedSize / (1024 * 1024)).toFixed(2);
  const reductionPercent = (((originalSize - compressedSize) / originalSize) * 100).toFixed(0);
  
  return `Imagen optimizada: ${originalMB}MB → ${compressedMB}MB (${reductionPercent}% reducción)`;
}
