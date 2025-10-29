import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, CalendarCheck, BookOpen, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface CourseData {
  id: string;
  title: string;
  slug: string;
  short_description: string;
}

interface EnrollmentData {
  started_at: string;
  expires_at: string;
  status: string;
}

export default function PaymentReturn() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const courseSlug = params.get('course_slug') || 'master-archicad';
        const provider = params.get('provider') || 'paypal';

        console.log('🔍 Cargando datos del pago exitoso - Curso:', courseSlug, 'Provider:', provider);

        // Mostrar éxito inmediatamente, luego intentar cargar datos
        setTimeout(() => setStatus('success'), 500);

        try {
          const { data: course } = await supabase
            .from('courses')
            .select('id, title, slug, short_description')
            .eq('slug', courseSlug)
            .maybeSingle();

          if (course) {
            setCourseData(course);
            console.log('✅ Datos del curso cargados:', course.title);

            // Intentar obtener enrollment (opcional)
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                const userResponse = await fetch('/api/current-user');
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  const userId = userData.user.id;

                  const { data: enrollment } = await supabase
                    .from('course_enrollments')
                    .select('started_at, expires_at, status')
                    .eq('course_id', course.id)
                    .eq('user_id', userId)
                    .maybeSingle();

                  if (enrollment) {
                    setEnrollmentData(enrollment);
                    console.log('✅ Datos de inscripción cargados');
                  } else {
                    console.log('⚠️ Inscripción no encontrada aún (puede tardar unos segundos)');
                  }
                }
              }
            } catch (e) {
              console.log('⚠️ No se pudieron cargar datos de inscripción (no crítico):', e);
            }
          } else {
            console.log('⚠️ Curso no encontrado, usando datos por defecto');
          }
        } catch (e) {
          console.log('⚠️ Error cargando datos adicionales (no crítico):', e);
        }

      } catch (error: any) {
        console.error('Error inesperado:', error);
        setStatus('success');
      }
    };

    loadPaymentData();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Procesando tu pago</CardTitle>
              <CardDescription className="mt-2">
                Estamos confirmando tu pago. Por favor espera un momento...
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="w-full max-w-md border-destructive shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto">
              <div className="h-16 w-16 rounded-full bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center">
                <span className="text-4xl">⚠️</span>
              </div>
            </div>
            <div>
              <CardTitle className="text-destructive text-xl">Error al procesar el pago</CardTitle>
              <CardDescription className="mt-2">
                {errorMessage}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setLocation('/learning/courses')}
              className="w-full"
              data-testid="button-back-to-courses"
            >
              Volver a Capacitaciones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startDate = enrollmentData?.started_at 
    ? format(new Date(enrollmentData.started_at), "d 'de' MMMM, yyyy", { locale: es })
    : format(new Date(), "d 'de' MMMM, yyyy", { locale: es });

  const endDate = enrollmentData?.expires_at
    ? format(new Date(enrollmentData.expires_at), "d 'de' MMMM, yyyy", { locale: es })
    : format(addMonths(new Date(), 12), "d 'de' MMMM, yyyy", { locale: es });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-6 pb-6">
          <div className="mx-auto">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">
                ¡Felicitaciones!
              </CardTitle>
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <CardDescription className="text-lg">
              Tu pago ha sido procesado exitosamente
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Te has suscrito al curso
                </p>
                <p className="text-xl font-semibold">
                  {courseData?.title || 'Curso'}
                </p>
                {courseData?.short_description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {courseData.short_description}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-start gap-3">
                <CalendarCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Periodo de suscripción
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Inicio</p>
                      <p className="text-sm font-medium">{startDate}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Vencimiento</p>
                      <p className="text-sm font-medium">{endDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <span className="font-medium">💡 Acceso al curso:</span> Puedes acceder a tu curso desde la sección{' '}
                  <span className="font-semibold">Capacitaciones</span> en el menú principal, o haciendo clic en el botón de abajo.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setLocation(`/learning/courses/${courseData?.slug || 'master-archicad'}`)}
            className="w-full h-12 text-base"
            size="lg"
            data-testid="button-go-to-course"
          >
            Ir al curso
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            ¡Que disfrutes tu aprendizaje! 🚀
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
