import { useParams, useLocation } from 'wouter';
import { useCurrentUser } from '@/features/users/hooks';
import { useCourseLanding, useCourseEnrollment, useCourseProgress } from '@/features/learning';

export interface CourseLandingViewData {
  course: any;
  modules: any[];
  faqs: any[];
  testimonials: any[];
  stats: any;
  clientGallery?: { id: string; url: string }[];
  isEnrolled: boolean;
  progressPercentage: number;
  ctaButtonText: string;
  isLoading: boolean;
  error: any;
  refetchEnrollment?: () => Promise<any>;
}

export function useCourseLandingView(slug: string | undefined): CourseLandingViewData & { handleCTAClick: () => void } {
  const [, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { data, isLoading, error } = useCourseLanding(slug || '');
  const { data: enrollmentData, refetch: refetchEnrollment } = useCourseEnrollment(data?.course?.id, userData?.user?.id);
  const { data: progressData } = useCourseProgress(data?.course?.id);

  const isEnrolled = enrollmentData?.isEnrolled || false;
  const progressPercentage = (() => {
    if (!progressData || progressData.length === 0) return 0;
    const completed = progressData.filter(p => p.is_completed).length;
    return Math.round((completed / progressData.length) * 100);
  })();

  const handleCTAClick = () => {
    const course = data?.course;
    // Block checkout if course is disabled
    if (!isEnrolled && course?.is_active === false) {
      return;
    }
    
    if (isEnrolled) {
      navigate(`/learning/courses/${course?.slug}`);
    } else if (userData?.user) {
      navigate(`/checkout?course=${course?.slug}`);
    } else {
      navigate('/register');
    }
  };

  const ctaButtonText = isEnrolled 
    ? (progressPercentage > 0 ? 'CONTINUAR CURSO' : 'VER CURSO')
    : 'INSCRIBIRME AHORA';

  return {
    course: data?.course,
    modules: data?.modules || [],
    faqs: data?.faqs || [],
    testimonials: data?.testimonials || [],
    stats: data?.stats,
    clientGallery: data?.clientGallery,
    isEnrolled,
    progressPercentage,
    ctaButtonText,
    isLoading,
    error,
    refetchEnrollment,
    handleCTAClick,
  };
}
