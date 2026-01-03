import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppBootStore } from '@/stores/appBootStore';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { supabase } from '@/lib/supabase';

interface BootGateProps {
  children: React.ReactNode;
}

async function sendPendingAcquisitionData() {
  const pendingAcquisition = sessionStorage.getItem('pending_user_acquisition');
  const acquisitionSent = sessionStorage.getItem('acquisition_sent');
  
  if (!pendingAcquisition || acquisitionSent || !supabase) {
    return;
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    
    const acquisitionData = JSON.parse(pendingAcquisition);
    sessionStorage.setItem('acquisition_sent', 'true');
    
    await fetch('/api/user/acquisition', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(acquisitionData)
    });
    
    sessionStorage.removeItem('pending_user_acquisition');
    sessionStorage.removeItem('acquisition_sent');
  } catch {
    sessionStorage.removeItem('acquisition_sent');
  }
}

export function BootGate({ children }: BootGateProps) {
  const { user, loading: authLoading, initialized: authInitialized } = useAuthStore();
  const { loading: bootLoading, signupCompleted, checkSignupStatus, stopPolling, reset } = useAppBootStore();
  const [hasCheckedSignup, setHasCheckedSignup] = useState(false);
  const checkStartedRef = useRef(false);
  const acquisitionSentRef = useRef(false);

  useEffect(() => {
    if (!authInitialized || authLoading) {
      return;
    }

    if (user) {
      if (!checkStartedRef.current) {
        checkStartedRef.current = true;
        checkSignupStatus().finally(() => {
          setHasCheckedSignup(true);
        });
      }
    } else {
      stopPolling();
      reset();
      setHasCheckedSignup(true);
      checkStartedRef.current = false;
    }
  }, [user, authInitialized, authLoading, checkSignupStatus, stopPolling, reset]);

  useEffect(() => {
    if (signupCompleted === true && user && !acquisitionSentRef.current) {
      acquisitionSentRef.current = true;
      sendPendingAcquisitionData();
    }
  }, [signupCompleted, user]);

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

  if (!hasCheckedSignup || bootLoading || signupCompleted === null) {
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
