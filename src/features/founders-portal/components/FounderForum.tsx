import { ForumPage } from '@/features/forum';

export function FounderForum() {
  return <ForumPage allowedRoles={['founder']} />;
}

export function CreateThreadDialog({ 
  open, 
  onOpenChange 
}: { 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void;
}) {
  return null;
}
