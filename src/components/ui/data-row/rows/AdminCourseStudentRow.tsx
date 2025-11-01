import DataRowCard from '../DataRowCard';
import { Badge } from '@/components/ui/badge';
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

const getStatusColor = (status: Enrollment['status']) => {
  const colors = {
    active: 'var(--accent)',
    completed: '#3b82f6',
    expired: '#ef4444',
    cancelled: '#6b7280'
  };
  return colors[status] || '#6b7280';
};

const getStatusLabel = (status: Enrollment['status']) => {
  const labels = {
    active: 'Activo',
    completed: 'Completado',
    expired: 'Expirado',
    cancelled: 'Cancelado'
  };
  return labels[status] || status;
};

export default function AdminCourseStudentRow({ 
  enrollment, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: AdminCourseStudentRowProps) {
  
  const progress = enrollment.progress || { 
    completed_lessons: 0, 
    total_lessons: 0, 
    progress_percentage: 0 
  };
  const percentage = progress.progress_percentage || 0;

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

      {/* Trailing Section - Progreso y Estado */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0 min-w-[100px]">
        {/* Estado */}
        <Badge 
          style={{ 
            backgroundColor: getStatusColor(enrollment.status), 
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px'
          }}
        >
          {getStatusLabel(enrollment.status)}
        </Badge>
        
        {/* Progreso */}
        <div className="w-full">
          <div className="text-right text-xs text-muted-foreground mb-1">
            {percentage.toFixed(0)}%
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                backgroundColor: 'var(--accent)',
                width: `${percentage}%`
              }}
            />
          </div>
        </div>
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
