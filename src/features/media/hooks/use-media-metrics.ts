import { useMemo } from 'react';
import type { GalleryFile } from '../types';

interface MediaMetrics {
  totalFiles: number;
  totalImages: number;
  totalVideos: number;
  timeline: { value: number; date: string }[];
}

/**
 * Hook para calcular métricas de archivos de media.
 * 
 * Calcula estadísticas sobre archivos de galería incluyendo:
 * - Total de archivos
 * - Total de imágenes
 * - Total de videos
 * - Timeline de creación de archivos por fecha
 * 
 * @param galleryFiles - Array de archivos de galería
 * @returns MediaMetrics con las estadísticas calculadas
 */
export function useMediaMetrics(galleryFiles: GalleryFile[]): MediaMetrics {
  return useMemo(() => {
    const totalFiles = galleryFiles.length;

    const totalImages = galleryFiles.filter(file => 
      file.file_type && file.file_type.toLowerCase().includes('image')
    ).length;

    const totalVideos = galleryFiles.filter(file => 
      file.file_type && file.file_type.toLowerCase().includes('video')
    ).length;

    // Generate historical timeline from all files
    // Group files by date
    const filesByDate: Record<string, number> = {};
    
    galleryFiles.forEach(file => {
      if (!file.created_at) return;
      try {
        // Extract date from created_at timestamp (format: YYYY-MM-DD)
        const dateStr = file.created_at.split('T')[0];
        filesByDate[dateStr] = (filesByDate[dateStr] || 0) + 1;
      } catch {
        // Skip invalid dates
      }
    });

    // Convert to timeline array sorted by date
    const timeline = Object.entries(filesByDate)
      .map(([date, count]) => ({
        value: count,
        date
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalFiles,
      totalImages,
      totalVideos,
      timeline
    };
  }, [galleryFiles]);
}
