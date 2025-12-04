import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestimonialCardProps {
  authorName: string;
  authorTitle?: string;
  authorAvatarUrl?: string;
  content: string;
  className?: string;
}

export function TestimonialCard({
  authorName,
  authorTitle,
  authorAvatarUrl,
  content,
  className
}: TestimonialCardProps) {
  const initials = authorName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'NN';

  return (
    <div className={cn("bg-card border rounded-lg p-5", className)} data-testid="testimonial-card">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={authorAvatarUrl || undefined} alt={authorName} />
          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
            {initials || <User className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm leading-tight">{authorName}</h4>
          {authorTitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{authorTitle}</p>
          )}
        </div>
      </div>
      
      <p className="text-sm mt-3 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}
