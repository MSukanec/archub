import { useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentUser } from "@/hooks/use-current-user";

interface AuthRedirectProps {
  children: ReactNode;
}

export function AuthRedirect({ children }: AuthRedirectProps) {
  const { user, initialized, loading } = useAuthStore();
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

    // If user is authenticated but needs onboarding (except for select-mode and dashboard during onboarding completion)
    const allowedDuringOnboarding = ['/onboarding', '/select-mode', '/organization/dashboard', '/dashboard'];
    if (user && userData && !userData.preferences?.onboarding_completed && !allowedDuringOnboarding.includes(location)) {
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