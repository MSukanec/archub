import { useState } from 'react';
import { ChevronDown, ChevronUp, PlayCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { formatMinutesToTime } from '../../mappers';
import type { ModuleWithLessons } from '../../types';
import { SectionHeader } from './SectionHeader';
interface LessonsSectionProps {
  modules: ModuleWithLessons[];
  title?: string;
  subtitle?: string;
  description?: string;
  variant?: 'default'| 'no-container';
}
export function LessonsSection({ 
  modules, 
  title = "LECCIONES DEL CURSO",
  subtitle = "CONTENIDO DETALLADO",
  description = "Explora todas las lecciones organizadas por módulos",
  variant = 'default'
}: LessonsSectionProps) {
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const toggleModule = (moduleId: string) => {
    setOpenModuleId((prev) => (prev === moduleId ? null : moduleId));
  };
  if (modules.length === 0) return null;
  const content = (
    <div className="space-y-12">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        description={description}
      />
      <div className="space-y-4">
        {modules.map((module, idx) => {
          const isOpen = openModuleId === module.id;
          return (
            <Collapsible
              key={module.id}
              open={isOpen}
              onOpenChange={() => toggleModule(module.id)}
            >
              <div className="bg-background rounded-lg border shadow-sm">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full px-6 py-3 h-auto flex items-center justify-between hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4 text-left flex-1">
                      <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-base">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-base font-semibold">{module.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <PlayCircle className="w-4 h-4" />
                              {module.lessons.length} lecciones
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatMinutesToTime(module.total_duration_min)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 border-b last:border-b-0"
                      >
                        <div className="flex-shrink-0">
                          <PlayCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{lesson.title}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {lesson.free_preview && (
                            <Badge variant="outline" className="text-xs">
                              Vista Previa
                            </Badge>
                          )}
                          {lesson.duration_sec && (
                            <span className="text-sm text-muted-foreground">
                              {formatMinutesToTime(lesson.duration_sec / 60)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
  if (variant === 'no-container') {
    return <section className="py-16 sm:py-20 bg-muted/30">{content}</section>;
  }
  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-0">
          {content}
          <div className="hidden xl:block" />
        </div>
      </div>
    </section>
  );
}
