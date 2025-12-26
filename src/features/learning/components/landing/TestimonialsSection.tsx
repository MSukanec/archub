import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SectionHeader } from './SectionHeader';
import type { Testimonial } from '@shared/schema';
interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  title?: string;
  subtitle?: string;
  description?: string;
  variant?: 'default'| 'no-container';
}
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const initials = testimonial.author_name
    .split('')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div 
      className="bg-background rounded-xl border shadow-sm p-6 flex flex-col gap-4 break-inside-avoid mb-4"
      data-testid={`testimonial-card-${testimonial.id}`}
    >
      {testimonial.rating && testimonial.rating > 0 && (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < testimonial.rating! 
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
      <div className="relative">
        <Quote className="absolute -top-1 -left-1 w-6 h-6 text-accent/20 transform -scale-x-100" />
        <p className="text-muted-foreground leading-relaxed pl-4 text-sm sm:text-base">
          {testimonial.content}
        </p>
      </div>
      <div className="flex items-center gap-3 pt-2 border-t mt-auto">
        <Avatar className="w-10 h-10 border-2 border-accent/20">
          <AvatarImage 
            src={testimonial.author_avatar_url || undefined} 
            alt={testimonial.author_name}
          />
          <AvatarFallback className="bg-accent/10 text-accent font-medium text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate text-foreground">
            {testimonial.author_name}
          </p>
          {testimonial.author_title && (
            <p className="text-xs text-muted-foreground truncate">
              {testimonial.author_title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
export function TestimonialsSection({ 
  testimonials,
  title = "OPINIONES DE ESTUDIANTES",
  subtitle = "TESTIMONIOS",
  description = "Lo que dicen nuestros estudiantes sobre el curso",
  variant = 'default'
}: TestimonialsSectionProps) {
  const activeTestimonials = testimonials.filter(t => t.is_active && !t.is_deleted);
  
  if (activeTestimonials.length === 0) return null;
  const content = (
    <div className="space-y-12">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        description={description}
      />
      <div 
        className="columns-1 sm:columns-2 lg:columns-3 gap-4"
        data-testid="testimonials-masonry"
      >
        {activeTestimonials
          .sort((a, b) => a.sort_index - b.sort_index)
          .map((testimonial) => (
            <TestimonialCard 
              key={testimonial.id} 
              testimonial={testimonial} 
            />
          ))}
      </div>
    </div>
  );
  if (variant === 'no-container') {
    return <section className="py-16 sm:py-20" data-testid="testimonials-section">{content}</section>;
  }
  return (
    <section className="py-16 sm:py-20" data-testid="testimonials-section">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-0">
          {content}
          <div className="hidden xl:block" />
        </div>
      </div>
    </section>
  );
}
