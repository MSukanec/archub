import { InfiniteCarousel, type CarouselItem } from '@/components/shared/InfiniteCarousel';
import { SectionHeader } from './SectionHeader';

interface ClientsSectionProps {
  images: CarouselItem[];
  title?: string;
  subtitle?: string;
  description?: string;
  height?: number;
  direction?: 'left' | 'right';
  visibleItems?: number;
}

export function ClientsSection({
  images,
  title = "NUESTROS CLIENTES",
  subtitle = "GALERÍA",
  description = "Proyectos realizados por nuestros estudiantes",
  height = 700,
  direction = 'left',
  visibleItems = 4
}: ClientsSectionProps) {
  if (!images || images.length === 0) return null;

  return (
    <section className="py-16 sm:py-20" data-testid="clients-section">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          <div className="lg:col-span-3 space-y-12">
            <SectionHeader
              title={title}
              subtitle={subtitle}
              description={description}
            />
          </div>
          
          <div className="hidden lg:block" />
        </div>
      </div>
      
      <div className="mt-8">
        <InfiniteCarousel
          items={images}
          height={height}
          direction={direction}
          visibleItems={visibleItems}
        />
      </div>
    </section>
  );
}
