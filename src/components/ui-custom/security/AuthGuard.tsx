import { useEffect, useState, useRef, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/stores/authStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectContextInit } from '@/hooks/use-project-context-init';
import { AuthModal } from '@/components/auth/AuthModal';

interface AuthGuardProps {
  children: ReactNode;
}

// Define route types for clarity
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password'];
const ONBOARDING_ROUTES = ['/onboarding', '/select-mode'];

export function AuthGuard({ children }: AuthGuardProps) {
  const { 
    user, 
    loading, 
    initialized, 
    initialize, 
    completingOnboarding,
    setCompletingOnboarding 
  } = useAuthStore();
  
  const { data: userData, isLoading: userDataLoading } = useCurrentUser();
  const [location, navigate] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const lastNavigationRef = useRef<string | null>(null);
  
  // Initialize project context when organization changes
  useProjectContextInit();

  // Force initialization if needed
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  // Main routing and auth logic
  useEffect(() => {
    // Wait for initialization, but allow processing when user is null (logged out)
    if (!initialized || (loading && user !== null) || userDataLoading) {
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(location);
    const isOnboardingRoute = ONBOARDING_ROUTES.includes(location);

    // CASE 1: No user - Handle unauthenticated state
    if (!user) {
      // Allow access to public routes
      if (isPublicRoute) {
        setShowAuthModal(false);
        return;
      }
      
      // Show auth modal for protected routes
      setShowAuthModal(true);
      
      // Redirect to landing page when logged out
      if (!isPublicRoute && lastNavigationRef.current !== '/') {
        lastNavigationRef.current = '/';
        navigate('/');
      }
      return;
    }

    // CASE 2: User exists - Handle authenticated state
    setShowAuthModal(false);

    // WAIT for userData to load before making any routing decisions
    if (!userData) {
      console.log('AuthGuard: Waiting for userData to load...');
      return;
    }

    // CASE 3: Check onboarding status FIRST (before any redirects)
    const onboardingCompleted = userData.preferences?.onboarding_completed;
    const hasPersonalData = userData.user_data?.first_name && userData.user_data?.last_name;
    
    // Check bypass flag
    const onboardingBypass = localStorage.getItem('onboarding_bypass') === 'true';
    const bypassUserId = localStorage.getItem('onboarding_bypass_user_id');
    
    // Handle bypass logic
    if (onboardingBypass) {
      // Clear bypass if it's from a different user or if user hasn't completed onboarding
      if (!onboardingCompleted || bypassUserId !== userData.user?.id) {
        console.log('AuthGuard: Clearing bypass for incomplete onboarding or different user');
        localStorage.removeItem('onboarding_bypass');
        localStorage.removeItem('onboarding_bypass_user_id');
      } else {
        // Bypass active for completed users - skip all onboarding checks
        console.log('AuthGuard: Bypass active, skipping onboarding checks');
        
        // Reset completing flag if we're on dashboard with completed onboarding
        if (onboardingCompleted && completingOnboarding && (location.includes('/dashboard') || location.includes('/organization'))) {
          console.log('AuthGuard: Resetting completingOnboarding flag');
          setCompletingOnboarding(false);
        }
        
        lastNavigationRef.current = null;
        return;
      }
    }

    // Don't interfere during onboarding completion process
    if (completingOnboarding) {
      console.log('AuthGuard: Onboarding completion in progress, not redirecting');
      return;
    }

    // Check if user needs onboarding
    const needsOnboarding = !onboardingCompleted || !hasPersonalData;
    
    if (needsOnboarding && !isOnboardingRoute) {
      // Redirect to onboarding
      if (lastNavigationRef.current !== '/onboarding') {
        console.log('AuthGuard: User needs onboarding, redirecting');
        lastNavigationRef.current = '/onboarding';
        navigate('/onboarding');
      }
      return;
    } else {
      // User is in valid state, reset tracking
      lastNavigationRef.current = null;
      
      // CASE 4: Redirect authenticated users away from public routes (only after onboarding check passes)
      if (isPublicRoute) {
        console.log('AuthGuard: Authenticated user on public route, redirecting to dashboard');
        navigate('/organization/dashboard');
        return;
      }
    }
  }, [
    user, 
    userData, 
    initialized, 
    loading, 
    userDataLoading, 
    location, 
    navigate, 
    completingOnboarding,
    setCompletingOnboarding
  ]);

  // Loading state
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  // Auth modal for unauthenticated users on protected routes
  if (!user && showAuthModal && !PUBLIC_ROUTES.includes(location)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AuthModal open={true} onOpenChange={setShowAuthModal} />
      </div>
    );
  }

  // Render children
  return <>{children}</>;
}