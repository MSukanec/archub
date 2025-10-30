import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Calendar, BookOpen, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

export default function PaymentSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseSlug = urlParams.get('course_slug');
  const provider = urlParams.get('provider') || 'paypal';

  // Fetch data from unified endpoint using authenticated request
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/checkout/success', courseSlug, provider],
    queryFn: async () => {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication session found');
      }

      const params = new URLSearchParams({
        course_slug: courseSlug || '',
        provider,
      });
      
      const response = await fetch(`/api/checkout/success?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch course data');
      return response.json();
    },
    enabled: !!courseSlug
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !data?.course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Curso no encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/learning'} className="w-full">
              Ir a Capacitaciones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { course, enrollment } = data;
  const startedAt = enrollment?.started_at ? new Date(enrollment.started_at) : new Date();
  const expiresAt = enrollment?.expires_at ? new Date(enrollment.expires_at) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <CardTitle className="text-2xl sm:text-3xl">¡Felicitaciones!</CardTitle>
            <CardDescription className="text-base mt-2">
              Te has suscrito exitosamente al curso
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Course Info */}
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            {course.thumbnail_url ? (
              <img 
                src={course.thumbnail_url} 
                alt={course.name}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight">{course.name}</h3>
              {course.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Inicio</p>
                <p className="text-sm font-medium">
                  {format(startedAt, "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Vencimiento</p>
                <p className="text-sm font-medium">
                  {format(expiresAt, "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            </div>
          </div>

          {/* Access Info */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Puedes acceder a tu curso desde la sección <span className="font-semibold text-foreground">Capacitaciones</span> en el menú principal.
              Todo tu progreso se guardará automáticamente.
            </p>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={() => window.location.href = `/learning/courses/${courseSlug}`}
            className="w-full"
            size="lg"
            data-testid="button-go-to-course"
          >
            Ir al curso ahora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Secondary action */}
          <Button 
            onClick={() => window.location.href = '/learning'}
            variant="ghost"
            className="w-full"
            data-testid="button-back-to-learning"
          >
            Ver todos mis cursos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
