import { useRef } from "react";
import { Camera, Loader2, Trash2, RotateCcw, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AvatarUploaderProps {
  avatarUrl?: string | null;
  initials: string;
  displayName: string;
  onAvatarSelect: (file: File) => void;
  onDeleteAvatar?: () => void;
  onRestoreGoogleAvatar?: () => void;
  hasGoogleAvatar?: boolean;
  isUploading?: boolean;
  className?: string;
}

export function AvatarUploader({
  avatarUrl,
  initials,
  displayName,
  onAvatarSelect,
  onDeleteAvatar,
  onRestoreGoogleAvatar,
  hasGoogleAvatar = false,
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

  const hasCustomAvatar = avatarUrl && avatarUrl.trim() !== '';
  const showMenu = hasCustomAvatar || hasGoogleAvatar;

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

        {/* Upload/Menu button overlay */}
        {showMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={isUploading}
                className={cn(
                  "absolute bottom-0 right-0 p-2 rounded-full",
                  "bg-accent text-white shadow-lg transition-all",
                  "hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                title="Opciones de foto"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <MoreVertical className="h-5 w-5" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => fileInputRef.current?.click()}
                data-testid="menu-change-avatar"
              >
                <Camera className="h-4 w-4 mr-2" />
                Cambiar foto
              </DropdownMenuItem>
              
              {hasGoogleAvatar && onRestoreGoogleAvatar && (
                <DropdownMenuItem 
                  onClick={onRestoreGoogleAvatar}
                  data-testid="menu-restore-google"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurar foto de Google
                </DropdownMenuItem>
              )}
              
              {hasCustomAvatar && onDeleteAvatar && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onDeleteAvatar}
                    className="text-destructive focus:text-destructive"
                    data-testid="menu-delete-avatar"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar foto
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
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
        )}

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
          {isUploading ? 'Procesando...' : hasCustomAvatar ? 'Haz clic en el menú para cambiar' : 'Haz clic en la cámara para añadir foto'}
        </p>
      </div>
    </div>
  );
}
