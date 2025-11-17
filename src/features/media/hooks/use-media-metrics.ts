import { useMemo } from 'react';
import type { GalleryFile } from '../types';

interface MediaMetrics {
  totalFiles: number;
  totalImages: number;
  totalVideos: number;
  timeline: { value: number; date: Date }[];
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

    // Generate historical timeline with running total
    // First, collect all file creation dates
    const fileDates: Date[] = [];
    
    galleryFiles.forEach(file => {
      if (!file.created_at) return;
      try {
        const date = new Date(file.created_at);
        // Reset time to midnight for proper grouping
        date.setHours(0, 0, 0, 0);
        fileDates.push(date);
      } catch {
        // Skip invalid dates
      }
    });

    // Sort dates chronologically
    fileDates.sort((a, b) => a.getTime() - b.getTime());

    // Determine the date range for the timeline
    let startDate: Date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (fileDates.length === 0) {
      // No files, show last 14 days with zeros
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 13);
    } else {
      const earliestFileDate = fileDates[0];
      const daysAgo14 = new Date(today);
      daysAgo14.setDate(daysAgo14.getDate() - 13);
      
      // Start from the earlier of: 14 days ago or first file date
      startDate = earliestFileDate < daysAgo14 ? earliestFileDate : daysAgo14;
    }

    // Build timeline with running total
    const timeline: { date: Date; value: number }[] = [];
    let cumulativeCount = 0;
    let fileIndex = 0;
    
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      // Count all files created up to and including this date
      while (fileIndex < fileDates.length && fileDates[fileIndex].getTime() <= currentDate.getTime()) {
        cumulativeCount++;
        fileIndex++;
      }
      
      timeline.push({
        date: new Date(currentDate),
        value: cumulativeCount
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      totalFiles,
      totalImages,
      totalVideos,
      timeline
    };
  }, [galleryFiles]);
}
