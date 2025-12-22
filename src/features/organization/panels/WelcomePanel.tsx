import { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOrganizationInitials } from '@/utils/initials';
import { cn } from '@/lib/utils';

interface WelcomePanelProps {
  userName: string;
  organizationName: string;
  logoUrl: string | null;
  isLogoUploading: boolean;
  onLogoUpload: (file: File) => void;
}

export function WelcomePanel({ 
  userName, 
  organizationName, 
  logoUrl, 
  isLogoUploading,
  onLogoUpload 
}: WelcomePanelProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      e.target.value = '';
      onLogoUpload(file);
    }
  };

  return (
    <div className="space-y-2 pb-6 border-b border-border">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 relative group">
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={isLogoUploading}
            className="relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-full"
            title="Cambiar logo de la organización"
            data-testid="button-upload-org-logo"
          >
            <Avatar className="h-16 w-16 border-2 border-accent">
              {logoUrl && logoUrl.trim() !== '' && (
                <AvatarImage 
                  src={logoUrl} 
                  alt={organizationName || 'Organización'}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="text-xl font-bold bg-accent text-white">
                {getOrganizationInitials(organizationName || '')}
              </AvatarFallback>
            </Avatar>

            <div className={cn(
              "absolute inset-0 rounded-full flex items-center justify-center transition-all",
              "bg-black/50 opacity-0 group-hover:opacity-100",
              isLogoUploading && "opacity-100"
            )}>
              {isLogoUploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
          </button>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLogoUploading}
            className="hidden"
            aria-label="Cargar logo de organización"
          />
        </div>
        <div>
          <h2 className="text-4xl font-bold text-foreground">
            Hola, {userName}
          </h2>
          <p className="text-lg text-muted-foreground mt-1">
            Estás en {organizationName || 'tu organización'}
          </p>
        </div>
      </div>
    </div>
  );
}
