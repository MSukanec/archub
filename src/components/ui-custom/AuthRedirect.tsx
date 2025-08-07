import { useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentUser } from "@/hooks/use-current-user";

interface AuthRedirectProps {
  children: ReactNode;
}

export function AuthRedirect({ children }: AuthRedirectProps) {
  const { user, initialized, loading, completingOnboarding, setCompletingOnboarding } = useAuthStore();
  const { data: userData, isLoading: userDataLoading } = useCurrentUser();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!initialized || loading || userDataLoading) return;

    const publicRoutes = ['/', '/login', '/register', '/forgot-password'];
    const isPublicRoute = publicRoutes.includes(location);

    // If user is authenticated and tries to access public routes, redirect to dashboard
    if (user && isPublicRoute) {
      navigate('/dashboard');
      return;
    }

    // If user is not authenticated and tries to access protected routes, redirect to login
    if (!user && !isPublicRoute) {
      navigate('/login');
      return;
    }

    // Reset completingOnboarding flag if user reaches dashboard with onboarding completed
    if (user && userData && userData.preferences?.onboarding_completed && completingOnboarding && (location.includes('/dashboard') || location.includes('/organization'))) {
      console.log('AuthRedirect: User reached dashboard with completed onboarding, resetting flag');
      setCompletingOnboarding(false);
    }

    // Check localStorage bypass flag first
    const onboardingBypass = localStorage.getItem('onboarding_bypass') === 'true';
    
    // If user is authenticated but needs onboarding (skip redirect if completing onboarding OR bypass is set)
    const allowedDuringOnboarding = ['/onboarding', '/select-mode', '/organization/dashboard', '/dashboard'];
    const shouldRedirectToOnboarding = user && userData && !userData.preferences?.onboarding_completed && !completingOnboarding && !onboardingBypass && !allowedDuringOnboarding.includes(location);
    
    console.log('AuthRedirect: Checking onboarding redirect', { 
      location, 
      user: !!user,
      userData: !!userData,
      onboarding_completed: userData?.preferences?.onboarding_completed,
      completingOnboarding,
      onboardingBypass,
      allowedRoute: allowedDuringOnboarding.includes(location),
      shouldRedirect: shouldRedirectToOnboarding
    });
    
    if (shouldRedirectToOnboarding) {
      console.log('AuthRedirect: REDIRECTING to onboarding');
      navigate('/onboarding');
      return;
    }
  }, [user, userData, initialized, loading, userDataLoading, location, navigate]);

  // Show loading while checking auth state
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return <>{children}</>;
}