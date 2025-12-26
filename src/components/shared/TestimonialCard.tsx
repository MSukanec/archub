import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';
interface TestimonialCardProps {
  authorName: string;
  authorTitle?: string;
  authorAvatarUrl?: string;
  content: string;
  rating?: number;
  showStars?: boolean;
  className?: string;
}
export function TestimonialCard({
  authorName,
  authorTitle,
  authorAvatarUrl,
  content,
  rating = 5,
  showStars = false,
  className
}: TestimonialCardProps) {
  const initials = authorName
    ?.split('')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'NN';
  return (
    <div className={cn("py-4", className)} data-testid="testimonial-card">
      {showStars && rating && (
        <div className="flex gap-0.5 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "w-4 h-4",
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={authorAvatarUrl || undefined} alt={authorName} />
          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
            {initials || <User className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm leading-tight">{authorName}</h4>
          {authorTitle && (
            <p className="text-xs text-muted-foreground">{authorTitle}</p>
          )}
        </div>
      </div>
      
      <p className="text-[13px] text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}
