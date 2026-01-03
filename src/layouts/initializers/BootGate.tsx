import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppBootStore } from '@/stores/appBootStore';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';

interface BootGateProps {
  children: React.ReactNode;
}

export function BootGate({ children }: BootGateProps) {
  const { user, loading: authLoading, initialized: authInitialized } = useAuthStore();
  const { loading: bootLoading, signupCompleted, checkSignupStatus, reset } = useAppBootStore();

  useEffect(() => {
    if (!authInitialized || authLoading) {
      return;
    }

    if (user) {
      checkSignupStatus();
    } else {
      reset();
    }
  }, [user, authInitialized, authLoading, checkSignupStatus, reset]);

  if (!authInitialized || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  if (bootLoading || signupCompleted === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground text-sm">Inicializando tu cuenta...</p>
      </div>
    );
  }

  if (signupCompleted === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground text-sm">Preparando tu espacio de trabajo...</p>
      </div>
    );
  }

  return <>{children}</>;
}
