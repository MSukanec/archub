import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useMultipleFeatureFlags } from '@/hooks/use-feature-flags';
import { BlockedRestricted } from '@/components/shared/restrictions';
import { ComingSoonCard } from '@/components/shared/restrictions/guards/ComingSoonCard';
import { useCurrentUser } from '@/features/users/hooks';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
import type { Course } from '@shared/schema';

interface CTAFooterProps {
  course: Course;
}

export function CTAFooter({ course }: CTAFooterProps) {
  const [, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const isAuthenticated = !!userData?.user;
  const isAdmin = useIsAdmin();
  
  const { flags: featureFlags, isReady: flagsReady } = useMultipleFeatureFlags(['course_purchases_enabled'], true);
  
  const isCourseDisabled = course.is_active === false;
  const isPurchasesDisabled = flagsReady && !featureFlags.course_purchases_enabled;
  
  // Only block if user is authenticated (going to checkout) AND purchases are disabled
  // Registration should NEVER be blocked by purchase flags
  const isCheckoutBlocked = isAuthenticated && (isCourseDisabled || isPurchasesDisabled);
  
  // Admin bypass: admins see the blocked visual state but can still click
  const isButtonDisabled = isCheckoutBlocked && !isAdmin;
  
  const handleClick = () => {
    if (isAuthenticated) {
      navigate(`/checkout?course=${course.slug}`);
    } else {
      navigate('/register');
    }
  };
  
  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            ¿Listo para comenzar?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
            Únete hoy y transforma tu forma de trabajar
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {/* Only show maintenance badge if authenticated user going to checkout */}
            <ComingSoonCard status={isAuthenticated && isPurchasesDisabled ? 'maintenance' : 'available'}>
              <BlockedRestricted
                isBlocked={isCheckoutBlocked}
                title="Curso no disponible"
                message="Este curso no está disponible para inscripción en este momento."
              >
                <Button 
                  size="lg" 
                  className="px-8 text-lg" 
                  disabled={isButtonDisabled}
                  onClick={handleClick}
                >
                  Inscribirme Ahora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </BlockedRestricted>
            </ComingSoonCard>
            {course.price && (
              <div className="text-center">
                <p className="text-3xl font-bold">${course.price}</p>
                <p className="text-sm text-muted-foreground">/ año</p>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Acceso inmediato • Sin compromisos • Contenido siempre disponible
          </p>
        </div>
      </div>
    </section>
  );
}
