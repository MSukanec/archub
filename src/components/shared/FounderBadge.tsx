import { Award } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
interface FounderBadgeProps {
  isFounder?: boolean;
  size?: 'sm'| 'md'| 'lg';
}
export function FounderBadge({ isFounder, size = 'md'}: FounderBadgeProps) {
  if (!isFounder) return null;
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Award className={`${sizeClasses[size]} text-amber-500`} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs">Organización Fundadora</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
