import { useEffect, useState, useRef, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/stores/authStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectContextInit } from '@/hooks/use-project-context-init';
import { AuthModal } from '@/components/auth/AuthModal';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

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
      return;
    }

    // CASE 3: Check onboarding status FIRST (before any redirects)
    const onboardingCompleted = userData.preferences?.onboarding_completed;
    const hasPersonalData = userData.user_data?.first_name && userData.user_data?.last_name;
    const hasSelectedMode = userData.preferences?.last_user_type;
    
    // Check bypass flag
    const onboardingBypass = localStorage.getItem('onboarding_bypass') === 'true';
    const bypassUserId = localStorage.getItem('onboarding_bypass_user_id');
    
    // Handle bypass logic
    if (onboardingBypass) {
      // Clear bypass if it's from a different user or if user hasn't completed onboarding
      if (!onboardingCompleted || bypassUserId !== userData.user?.id) {
        localStorage.removeItem('onboarding_bypass');
        localStorage.removeItem('onboarding_bypass_user_id');
      } else {
        // Bypass active for completed users - skip all onboarding checks
        
        // Reset completing flag if we're on dashboard with completed onboarding
        if (onboardingCompleted && completingOnboarding && (location.includes('/dashboard') || location.includes('/organization'))) {
          setCompletingOnboarding(false);
        }
        
        lastNavigationRef.current = null;
        return;
      }
    }

    // Don't interfere during onboarding completion process
    if (completingOnboarding) {
      return;
    }

    // Check if user needs basic onboarding (personal data)
    const needsBasicOnboarding = !onboardingCompleted || !hasPersonalData;
    
    if (needsBasicOnboarding && !isOnboardingRoute) {
      // Redirect to onboarding
      if (lastNavigationRef.current !== '/onboarding') {
        lastNavigationRef.current = '/onboarding';
        navigate('/onboarding');
      }
      return;
    }
    
    // CASE 4: Check if user needs to select mode (after basic onboarding is complete)
    const needsModeSelection = onboardingCompleted && hasPersonalData && !hasSelectedMode;
    
    if (needsModeSelection && location !== '/select-mode') {
      // Redirect to mode selection
      if (lastNavigationRef.current !== '/select-mode') {
        lastNavigationRef.current = '/select-mode';
        navigate('/select-mode');
      }
      return;
    }
    
    // User doesn't need onboarding or mode selection, reset tracking
    lastNavigationRef.current = null;
    
    // CASE 4: Redirect authenticated users away from public routes (only after onboarding check passes)
    if (isPublicRoute) {
      navigate('/home');
      return;
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
    return <LoadingSpinner fullScreen size="lg" />;
  }

  // Auth modal for unauthenticated users on protected routes
  if (!user && showAuthModal && !PUBLIC_ROUTES.includes(location)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AuthModal open={true} onOpenChange={setShowAuthModal} />
      </div>
    );
  }

  // Show loading while userData is being fetched for authenticated users on protected routes
  const isPublicRoute = PUBLIC_ROUTES.includes(location);
  const isOnboardingRoute = ONBOARDING_ROUTES.includes(location);
  
  if (user && userDataLoading && !isPublicRoute && !isOnboardingRoute) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  // Block rendering if user needs onboarding but is not on onboarding route
  if (user && userData && !isOnboardingRoute) {
    const onboardingCompleted = userData.preferences?.onboarding_completed;
    const hasPersonalData = userData.user_data?.first_name && userData.user_data?.last_name;
    const onboardingBypass = localStorage.getItem('onboarding_bypass') === 'true';
    const bypassUserId = localStorage.getItem('onboarding_bypass_user_id');
    const bypassValid = onboardingBypass && onboardingCompleted && bypassUserId === userData.user?.id;
    
    const needsOnboarding = (!onboardingCompleted || !hasPersonalData) && !bypassValid && !completingOnboarding;
    
    if (needsOnboarding) {
      // Show loading instead of rendering the protected content
      return <LoadingSpinner fullScreen size="lg" />;
    }
  }

  // Render children
  return <>{children}</>;
}