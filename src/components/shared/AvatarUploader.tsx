import React, { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarUploaderProps {
  avatarUrl?: string | null;
  initials: string;
  displayName: string;
  onAvatarSelect: (file: File) => void;
  isUploading?: boolean;
  className?: string;
  size?: AvatarSize;
  showLabel?: boolean;
}

const sizeConfig = {
  sm: {
    avatar: "h-16 w-16",
    fallbackText: "text-xl",
    cameraButton: "p-1.5",
    cameraIcon: "h-3.5 w-3.5",
  },
  md: {
    avatar: "h-24 w-24",
    fallbackText: "text-2xl",
    cameraButton: "p-1.5",
    cameraIcon: "h-4 w-4",
  },
  lg: {
    avatar: "h-32 w-32",
    fallbackText: "text-4xl",
    cameraButton: "p-2",
    cameraIcon: "h-5 w-5",
  }
};

export function AvatarUploader({
  avatarUrl,
  initials,
  displayName,
  onAvatarSelect,
  isUploading = false,
  className
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      onAvatarSelect(file);
    }
    e.currentTarget.value = '';
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-32 w-32 border-4 border-accent shadow-lg">
          {avatarUrl && avatarUrl.trim() !== '' && (
            <AvatarImage 
              src={avatarUrl} 
              alt={`Avatar de ${displayName}`}
              className="object-cover"
            />
          )}
          <AvatarFallback className="text-4xl font-bold bg-accent text-white">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Upload button overlay */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "absolute bottom-0 right-0 p-2 rounded-full",
            "bg-accent text-white shadow-lg transition-all",
            "hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          title="Cambiar foto de perfil"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
          aria-label="Cargar foto de perfil"
        />
      </div>

      {/* Label */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">{displayName}</h3>
        <p className="text-sm text-muted-foreground">
          {isUploading ? 'Subiendo foto...' : 'Haz clic en la cámara para cambiar la foto'}
        </p>
      </div>
    </div>
  );
}
