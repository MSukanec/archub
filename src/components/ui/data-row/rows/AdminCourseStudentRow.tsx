import DataRowCard from '../DataRowCard';
import { GraduationCap } from 'lucide-react';

interface EnrollmentProgress {
  completed_lessons: number;
  total_lessons: number;
  progress_percentage: number;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  started_at: string;
  expires_at?: string | null;
  users?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  courses?: {
    id: string;
    title: string;
    slug: string;
  };
  progress?: EnrollmentProgress;
  payment?: {
    currency: string;
    amount: number;
    provider: string;
  };
}

interface AdminCourseStudentRowProps {
  enrollment: Enrollment;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

const getUserInitials = (enrollment: Enrollment): string => {
  const fullName = enrollment.users?.full_name;
  if (fullName) {
    const names = fullName.trim().split(' ');
    if (names.length > 1) {
      return names.slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
    }
    return fullName.slice(0, 2).toUpperCase();
  }
  return enrollment.users?.email?.slice(0, 2).toUpperCase() || 'U';
};

// Componente para mostrar el progreso del estudiante
const StudentProgress = ({ progress }: { progress?: EnrollmentProgress }) => {
  const percentage = progress?.progress_percentage || 0;
  
  return (
    <div className="text-right">
      <div className="text-xs text-muted-foreground mb-1">
        Progreso: {percentage.toFixed(0)}%
      </div>
      <div className="text-xs text-muted-foreground">
        {progress?.completed_lessons || 0} / {progress?.total_lessons || 0} lecciones
      </div>
    </div>
  );
};

export default function AdminCourseStudentRow({ 
  enrollment, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: AdminCourseStudentRowProps) {
  
  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Primera fila - Nombre del usuario */}
        <div className="font-semibold text-sm truncate">
          {enrollment.users?.full_name || 'Sin nombre'}
        </div>

        {/* Segunda fila - Título del curso */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          <GraduationCap className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{enrollment.courses?.title || 'Sin curso'}</span>
        </div>
      </div>

      {/* Trailing Section - Progreso */}
      <div className="flex items-center">
        <StudentProgress progress={enrollment.progress} />
        {/* Espacio mínimo para chevron si existe */}
        {onClick && <div className="w-2" />}
      </div>
    </>
  );

  return (
    <DataRowCard
      avatarUrl={enrollment.users?.avatar_url}
      avatarFallback={getUserInitials(enrollment)}
      selected={selected}
      density={density}
      onClick={onClick}
      className={className}
      data-testid={`course-student-row-${enrollment.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

export type { Enrollment, EnrollmentProgress };
