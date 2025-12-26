import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, ArrowUpCircle } from 'lucide-react';
import { useLocation } from 'wouter';
interface ReadOnlyBannerProps {
  show: boolean;
  projectName?: string;
}
export function ReadOnlyBanner({ show, projectName }: ReadOnlyBannerProps) {
  const [, navigate] = useLocation();
  
  if (!show) return null;
  
  return (
    <Alert className="mb-4 border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
      <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-800 dark:text-amber-200 font-medium">
        Modo Solo Lectura
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300 flex items-center justify-between">
        <span>
          {projectName 
            ? `El proyecto "${projectName}" excede los límites de tu plan actual. No puedes realizar cambios.`
            : 'Este proyecto excede los límites de tu plan actual. No puedes realizar cambios.'}
        </span>
        <Button 
          size="sm" 
          variant="outline"
          className="ml-4 border-amber-500 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
          onClick={() => navigate('/organization/billing')}
          data-testid="button-upgrade-plan-banner"
        >
          <ArrowUpCircle className="h-4 w-4 mr-2" />
          Mejorar Plan
        </Button>
      </AlertDescription>
    </Alert>
  );
}
