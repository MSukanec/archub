import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Camera, User, Settings, Building, Package, Hammer, Eye, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { useCurrentUser, type UserData } from '@/features/users/hooks';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { useCountries } from '@/hooks/use-countries';
import { useSaveEngine } from '@/core/save-engine';
import { usersKeys } from '@/core/query-keys';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { AvatarUploader } from '@/components/shared/fields/AvatarUploader';
import imageCompression from 'browser-image-compression';

interface FormData {
  firstName: string;
  lastName: string;
  country: string;
  birthdate: Date | undefined;
  avatarUrl: string;
}

const getUserModeInfo = (userType: string | null) => {
  switch (userType) {
    case 'professional':
      return { icon: Building, label: 'Profesional', description: 'Estudios y constructoras' };
    case 'provider':
      return { icon: Package, label: 'Proveedor de Materiales', description: 'Suministro de materiales' };
    case 'worker':
      return { icon: Hammer, label: 'Mano de Obra', description: 'Contratistas y maestros' };
    case 'visitor':
      return { icon: Eye, label: 'Solo Exploración', description: 'Modo exploración' };
    default:
      return { icon: Settings, label: 'No definido', description: 'Selecciona tu modo de uso' };
  }
};

const normalizeStringValue = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export function UserBasicDataView() {
  const { data: userData, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { logout } = useAuthStore();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [birthdate, setBirthdate] = useState<Date | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const hasHydratedRef = useRef(false);
  const lastHydratedIdRef = useRef<string | null>(null);

  const { data: countries = [], isLoading: countriesLoading } = useCountries();

  const formData = useMemo<FormData>(() => ({
    firstName,
    lastName,
    country,
    birthdate,
    avatarUrl,
  }), [firstName, lastName, country, birthdate, avatarUrl]);

  useSaveEngine<FormData>({
    data: formData,
    queryKey: usersKeys.current(),
    delay: 500,
    enabled: isHydrated && !!userData?.user?.id,
    saveFn: async (dataToSave) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      let birthdateString: string | null = null;
      if (dataToSave.birthdate) {
        const year = dataToSave.birthdate.getFullYear();
        const month = String(dataToSave.birthdate.getMonth() + 1).padStart(2, '0');
        const day = String(dataToSave.birthdate.getDate()).padStart(2, '0');
        birthdateString = `${year}-${month}-${day}`;
      }
      
      const profileUpdates: Record<string, any> = {
        user_id: userData?.user?.id,
        first_name: normalizeStringValue(dataToSave.firstName),
        last_name: normalizeStringValue(dataToSave.lastName),
        country: normalizeStringValue(dataToSave.country),
        birthdate: birthdateString,
      };
      
      if (dataToSave.avatarUrl !== userData?.user?.avatar_url) {
        profileUpdates.avatar_url = dataToSave.avatarUrl;
      }
      
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(profileUpdates),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    },
    optimisticUpdate: (oldData: UserData | null, newData: FormData) => {
      if (!oldData) return oldData;
      
      let birthdateString: string | null = null;
      if (newData.birthdate) {
        const year = newData.birthdate.getFullYear();
        const month = String(newData.birthdate.getMonth() + 1).padStart(2, '0');
        const day = String(newData.birthdate.getDate()).padStart(2, '0');
        birthdateString = `${year}-${month}-${day}`;
      }
      
      return {
        ...oldData,
        user_data: {
          ...oldData.user_data,
          first_name: newData.firstName,
          last_name: newData.lastName,
          country: newData.country,
          birthdate: birthdateString,
        },
        user: {
          ...oldData.user,
          avatar_url: newData.avatarUrl,
        },
      };
    },
  });

  useEffect(() => {
    if (!userData) return;
    
    const userId = userData.user?.id;
    if (hasHydratedRef.current && lastHydratedIdRef.current === userId) {
      return;
    }
    
    hasHydratedRef.current = true;
    lastHydratedIdRef.current = userId ?? null;
    
    setFirstName(userData.user_data?.first_name || '');
    setLastName(userData.user_data?.last_name || '');
    setCountry(userData.user_data?.country || '');
    
    if (userData.user_data?.birthdate) {
      const [year, month, day] = userData.user_data.birthdate.split('-').map(Number);
      setBirthdate(new Date(year, month - 1, day, 12, 0, 0, 0));
    } else {
      setBirthdate(undefined);
    }
    
    setAvatarUrl(userData.user?.avatar_url || '');
    
    // Get Google avatar from Supabase Auth user_metadata
    const fetchGoogleAvatar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
      if (googleAvatar) {
        setGoogleAvatarUrl(googleAvatar);
      }
    };
    fetchGoogleAvatar();
    
    setTimeout(() => {
      setIsHydrated(true);
    }, 100);
  }, [userData]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarSelect = async (file: File) => {
    try {
      setIsUploadingAvatar(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Sesión expirada. Por favor inicia sesión de nuevo.",
          variant: "destructive",
        });
        return;
      }

      // Compress image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });

      // Upload to storage (user-avatars bucket - dedicated public bucket)
      // Use auth_id for folder name to match Supabase RLS (auth.uid())
      const fileName = `${userData?.user?.auth_id}/avatar.webp`;
      const { error: uploadError } = await supabase
        .storage
        .from('user-avatars')
        .upload(fileName, compressedFile, {
          upsert: true,
          contentType: 'image/webp',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Error",
          description: "No se pudo subir la imagen. Inténtalo de nuevo.",
          variant: "destructive",
        });
        return;
      }

      // Get public URL
      const { data } = supabase
        .storage
        .from('user-avatars')
        .getPublicUrl(fileName);

      if (data?.publicUrl) {
        // Add cache buster to force refresh
        setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Error al subir la imagen.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRestoreGoogleAvatar = async () => {
    if (!googleAvatarUrl) return;
    
    try {
      setIsUploadingAvatar(true);
      setAvatarUrl(googleAvatarUrl);
      
      toast({
        title: "Avatar restaurado",
        description: "Se ha restaurado tu foto de Google.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo restaurar el avatar de Google.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      
      // Delete from storage if it's a custom upload
      if (avatarUrl && avatarUrl.includes('user-avatars')) {
        const fileName = `${userData?.user?.auth_id}/avatar.webp`;
        await supabase.storage.from('user-avatars').remove([fileName]);
      }
      
      // Clear the avatar
      setAvatarUrl('');
      
      toast({
        title: "Avatar eliminado",
        description: "Tu foto de perfil ha sido eliminada.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el avatar.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return userData?.user?.full_name?.charAt(0)?.toUpperCase() || 'U';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Usuario no encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-lg font-semibold">Perfil</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta información se mostrará públicamente, así que ten cuidado con lo que compartes.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Avatar</Label>
              <AvatarUploader
                avatarUrl={avatarUrl}
                initials={getInitials()}
                displayName={userData.user.full_name || 'Usuario'}
                onAvatarSelect={handleAvatarSelect}
                onDeleteAvatar={handleDeleteAvatar}
                onRestoreGoogleAvatar={handleRestoreGoogleAvatar}
                hasGoogleAvatar={!!googleAvatarUrl}
                isUploading={isUploadingAvatar}
                className="items-center justify-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nombre completo</Label>
              <Input
                value={userData.user.full_name || ''}
                disabled
                className="bg-muted"
                data-testid="input-full-name"
              />
              <p className="text-xs text-muted-foreground">
                Este es tu nombre para mostrar. Puede ser tu nombre real o un seudónimo.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Dirección de email</Label>
              <Input
                value={userData.user.email || ''}
                disabled
                className="bg-muted"
                data-testid="input-email"
              />
              <p className="text-xs text-muted-foreground">
                Esta es la dirección de email de tu cuenta.
              </p>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t border-[var(--section-divider)] my-8" />

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-lg font-semibold">Información Personal</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Actualiza tus datos personales aquí.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nombre</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Apellido</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">País</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger data-testid="select-country">
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin seleccionar</SelectItem>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha de nacimiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        placeholder="Seleccionar fecha"
                        value={birthdate ? format(birthdate, 'dd/MM/yyyy', { locale: es }) : ''}
                        className="pr-10 cursor-pointer"
                        readOnly
                        data-testid="input-birthdate"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={birthdate}
                      onSelect={setBirthdate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t border-[var(--section-divider)] my-8" />

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-lg font-semibold">Modo de uso</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Personaliza tu experiencia según tu tipo de actividad.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4 p-4 border border-[var(--accent)] rounded-lg">
              {(() => {
                const modeInfo = getUserModeInfo(userData.preferences?.last_user_type);
                const ModeIcon = modeInfo.icon;
                return (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[var(--accent)]">Modo de uso actual</Label>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-[var(--accent)]/10">
                          <ModeIcon className="h-5 w-5 text-[var(--accent)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{modeInfo.label}</p>
                          <p className="text-xs text-muted-foreground">{modeInfo.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => navigate('/select-mode')}
                      size="sm"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-foreground)'
                      }}
                      className="hover:opacity-90"
                      data-testid="button-change-mode"
                    >
                      Elegir modo de uso
                    </Button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t border-[var(--section-divider)] my-8" />

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-lg font-semibold">Zona de peligro</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Acciones irreversibles y destructivas.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4 p-4 border border-destructive rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-destructive">Cerrar sesión</Label>
                <p className="text-xs text-muted-foreground">
                  Cerrar sesión de tu cuenta. Serás redirigido a la página de inicio de sesión.
                </p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" data-testid="button-logout">
                    Cerrar sesión
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Estás a punto de cerrar tu sesión. Necesitarás iniciar sesión nuevamente para acceder a tu cuenta.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>
                      Cerrar sesión
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
