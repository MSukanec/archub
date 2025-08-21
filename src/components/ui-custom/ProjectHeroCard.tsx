import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Move, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectHeroCardProps {
  project?: {
    id: string;
    name: string;
    status?: string;
    created_at?: string;
    project_data?: {
      project_image_url?: string | null;
    } | null;
  } | null;
  organizationId?: string | null;
  onImageUpdate?: () => void;
}

function getProjectInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export default function ProjectHeroCard({ project, organizationId, onImageUpdate }: ProjectHeroCardProps) {
  // Return null if no project data
  if (!project || !organizationId) {
    return null;
  }
  const [imagePosition, setImagePosition] = useState(50); // Vertical position percentage
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProjectImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!organizationId) throw new Error('Missing organization ID');

      // Use the specialized upload function
      const { uploadProjectImage, updateProjectImageUrl } = await import('@/lib/storage/uploadProjectImage');
      
      // Upload image
      const uploadResult = await uploadProjectImage(file, project.id, organizationId);
      
      // Update project data table
      await updateProjectImageUrl(project.id, uploadResult.file_url);

      return uploadResult.file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stats'] });
      toast({
        title: "Imagen actualizada",
        description: "La imagen del proyecto se ha actualizado correctamente.",
      });
      onImageUpdate?.();
    },
    onError: (error) => {
      toast({
        title: "Error al subir imagen",
        description: "No se pudo actualizar la imagen del proyecto.",
        variant: "destructive",
      });
      console.error('Error uploading image:', error);
    },
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!project.project_data?.project_image_url) return;
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const card = (e.target as HTMLElement).closest('.hero-card');
      if (!card) return;
      
      const rect = card.getBoundingClientRect();
      const y = moveEvent.clientY - rect.top;
      const percentage = Math.min(Math.max((y / rect.height) * 100, 0), 100);
      setImagePosition(percentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Settings Button */}
      <input
        type="file"
        id="project-image-upload"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            updateProjectImageMutation.mutate(file);
          }
          e.target.value = '';
        }}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-4 right-4 h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white border border-white/20 disabled:opacity-50 cursor-pointer z-50"
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const input = document.getElementById('project-image-upload') as HTMLInputElement;
          if (input) {
            input.click();
          }
        }}
        disabled={updateProjectImageMutation.isPending}
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* Move indicator when image exists */}
      {project.project_data?.project_image_url && (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded px-2 py-1 text-white text-xs">
          <Move className="h-3 w-3" />
          <span>Arrastra para posicionar</span>
        </div>
      )}

      <Card 
        className={`hero-card relative overflow-hidden border-[var(--card-border)] h-60 md:h-56 ${
          project.project_data?.project_image_url ? 'cursor-move' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        {/* Background Image */}
        {project.project_data?.project_image_url ? (
          <img 
            src={project.project_data.project_image_url}
            alt="Project background"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-200"
            style={{
              objectPosition: `center ${imagePosition}%`
            }}
            onError={(e) => {
              console.error('Error loading project image:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--accent)]" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <CardContent className="relative z-10 p-4 md:p-6 h-full flex flex-col justify-end">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
            {/* Project Icon */}
            <div className="flex-shrink-0">
              <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-white/30">
                <AvatarFallback className="text-sm md:text-lg font-bold text-white bg-white/20">
                  {getProjectInitials(project.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Project Info */}
            <div className="flex-1">
              <motion.h1
                className="text-2xl md:text-4xl font-black text-white mb-1"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {project.name}
              </motion.h1>
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                <p className="text-base md:text-lg text-white/90">
                  Resumen del proyecto
                </p>
                {project.status && (
                  <Badge 
                    variant="outline" 
                    className="w-fit border-0"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-foreground)'
                    }}
                  >
                    {project.status === 'active' ? 'Activo' : 
                     project.status === 'completed' ? 'Completado' : 
                     project.status === 'on_hold' ? 'En Pausa' : 'Estado'}
                  </Badge>
                )}
              </div>
              {project.created_at && (
                <div className="flex items-center gap-1 mt-2 text-xs text-white/80">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Creado el {format(new Date(project.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}