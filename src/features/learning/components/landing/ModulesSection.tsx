import { Clock, BookOpen } from 'lucide-react';
import { formatMinutesToTime } from '../../mappers';
import type { ModuleWithLessons } from '../../types';
import { SectionHeader } from './SectionHeader';

interface ModulesSectionProps {
  modules: ModuleWithLessons[];
  title?: string;
  subtitle?: string;
  description?: string;
}

export function ModulesSection({ 
  modules, 
  title = "MÓDULOS DEL CURSO",
  subtitle = "CONTENIDO ESTRUCTURADO",
  description = "Cada módulo está diseñado para llevarte paso a paso hacia la maestría"
}: ModulesSectionProps) {
  if (modules.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid: 3/4 for content, 1/4 empty space for sticky */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          {/* Content Area - 3/4 of width */}
          <div className="lg:col-span-3 space-y-12">
            <SectionHeader
              title={title}
              subtitle={subtitle}
              description={description}
            />

            {/* Modules Grid - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.map((module, idx) => (
                <div
                  key={module.id}
                  className="group bg-background rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Module Image/GIF */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {(module as any).module_image_url ? (
                      <img
                        src={(module as any).module_image_url}
                        alt={module.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                            <span className="text-3xl font-bold text-primary">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Imagen del módulo</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Module Content */}
                  <div className="p-6">
                    {/* Module Header - vertical layout on mobile */}
                    <div className="mb-4 space-y-2">
                      <span className="font-bold block" style={{ fontSize: '16px', color: 'var(--accent)' }}>
                        MÓDULO {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-3" style={{ fontSize: '14px', color: 'var(--accent)' }}>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {module.lessons?.length || 0} lecciones
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatMinutesToTime(module.total_duration_min || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Module Title - 36px */}
                    <h3 className="font-semibold mb-4 group-hover:text-primary transition-colors" style={{ fontSize: '36px', lineHeight: '1.2' }}>
                      {module.title}
                    </h3>

                    {/* Module Description - No truncation */}
                    {module.description && (
                      <p className="text-sm text-muted-foreground">
                        {module.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty Space - 1/4 of width for sticky to pass over */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
