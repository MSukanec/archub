import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Layout } from '@/components/layout/desktop/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export default function PaymentReturn() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const [courseSlug, setCourseSlug] = useState<string>('');

  // Remove initial loader cuando el componente se monta
  useEffect(() => {
    const initialLoader = document.getElementById('initial-loader');
    if (initialLoader) {
      initialLoader.classList.add('fade-out');
      setTimeout(() => {
        initialLoader.remove();
      }, 300);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const course = params.get('course') || '';
    setCourseSlug(course);

    if (!course) {
      setStatus('error');
      setError('No se especificó el curso');
      return;
    }

    // 🚀 OPTIMIZACIÓN CRÍTICA: Invalidar cache INMEDIATAMENTE (optimistic update)
    // Esto hace que CourseList se refresque ANTES de confirmar el enrollment
    queryClient.invalidateQueries({ queryKey: ['/api/learning/courses-full'] });
    queryClient.invalidateQueries({ queryKey: ['/api/user/enrollments'] });
    queryClient.invalidateQueries({ queryKey: ['/api/learning/dashboard'] });

    let timeoutId: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 60; // 30 seconds maximum (60 * 500ms)

    const checkEnrollment = async () => {
      try {
        if (!supabase) {
          setStatus('error');
          setError('Error de conexión');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setStatus('error');
          setError('No hay sesión activa');
          return;
        }

        // Check enrollment status
        const response = await fetch('/api/user/enrollments', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al verificar inscripción');
        }

        const enrollments = await response.json();
        const enrollment = enrollments.find((e: any) => e.course_slug === course && e.is_active);

        if (enrollment) {
          setStatus('success');
          // 🚀 CRÍTICO: Invalidar TODOS los caches para refresh instantáneo
          queryClient.invalidateQueries({ queryKey: ['/api/learning/courses-full'] });
          queryClient.invalidateQueries({ queryKey: ['/api/user/enrollments'] });
          queryClient.invalidateQueries({ queryKey: ['/api/user/course-progress'] });
          queryClient.invalidateQueries({ queryKey: ['course-progress-view'] });
          queryClient.invalidateQueries({ queryKey: ['/api/learning/dashboard'] });
          
          // Pre-fetch para hacer la navegación instantánea
          queryClient.prefetchQuery({ 
            queryKey: ['/api/learning/courses-full']
          });
          
          return;
        }

        // Continue polling if not found yet
        attempts++;
        if (attempts < maxAttempts) {
          timeoutId = setTimeout(checkEnrollment, 500); // ⚡ Reducido de 1.5s a 500ms
        } else {
          setStatus('error');
          setError('El proceso de pago está tomando más tiempo del esperado. Por favor, verifica tu correo electrónico o contacta a soporte.');
        }
      } catch (err: any) {
        console.error('Error checking enrollment:', err);
        setStatus('error');
        setError(err.message || 'Error al verificar el estado del pago');
      }
    };

    checkEnrollment();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleGoToCourse = () => {
    if (courseSlug) {
      navigate(`/learning/courses`);
    }
  };

  const handleBackToCourses = () => {
    navigate('/learning/courses');
  };

  const headerProps = {
    title: "Estado del Pago",
    showBackButton: false,
    isViewMode: true
  };

  return (
    <Layout headerProps={headerProps} wide>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {status === 'processing' && (
              <>
                <div className="mx-auto mb-4">
                  <Loader2 className="h-16 w-16 animate-spin text-accent" />
                </div>
                <CardTitle>Procesando pago...</CardTitle>
                <CardDescription>
                  No cierres esta página. Estamos verificando tu pago.
                </CardDescription>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="mx-auto mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle>¡Pago exitoso!</CardTitle>
                <CardDescription>
                  Ya tienes acceso al curso. Puedes comenzar a aprender.
                </CardDescription>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="mx-auto mb-4">
                  <XCircle className="h-16 w-16 text-red-500" />
                </div>
                <CardTitle>Hubo un problema</CardTitle>
                <CardDescription>
                  {error || 'No pudimos verificar tu pago'}
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="flex flex-col gap-3">
            {status === 'success' && (
              <Button
                variant="default"
                onClick={handleGoToCourse}
                className="w-full"
                data-testid="button-go-to-course"
              >
                Ir a mis cursos
              </Button>
            )}
            
            {status === 'error' && (
              <Button
                variant="default"
                onClick={handleBackToCourses}
                className="w-full"
                data-testid="button-back-to-courses"
              >
                Volver a cursos
              </Button>
            )}
            
            {status === 'processing' && (
              <div className="text-center text-sm text-muted-foreground">
                Esto puede tomar unos segundos...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
