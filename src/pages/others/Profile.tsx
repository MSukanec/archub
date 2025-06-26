import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Camera, User, Settings, Upload, Link as LinkIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { useSidebarStore } from '@/stores/sidebarStore'

interface Country {
  id: string
  name: string
}

export default function Profile() {
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const { isDocked, setDocked } = useSidebarStore()
  const { signOut } = useAuthStore()

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [sidebarDocked, setSidebarDocked] = useState(false)

  // Avatar upload states
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [avatarUrlInput, setAvatarUrlInput] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Load countries
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      return data as Country[]
    }
  })

  // Load user data into form when available
  useEffect(() => {
    if (userData) {
      setFirstName(userData.user_data?.first_name || '')
      setLastName(userData.user_data?.last_name || '')
      setCountry(userData.user_data?.country || '')
      setBirthdate(userData.user_data?.birthdate || '')
      setAvatarUrl(userData.user?.avatar_url || '')
      setSidebarDocked(userData.preferences?.sidebar_docked || false)
    }
  }, [userData])

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: {
      firstName: string
      lastName: string
      country: string
      birthdate: string
      avatarUrl: string
      sidebarDocked: boolean
    }) => {
      if (!userData?.user?.id || !userData?.preferences?.id) {
        throw new Error('Missing user data')
      }

      // Update user avatar
      if (profileData.avatarUrl !== userData.user.avatar_url) {
        const { error: userError } = await supabase
          .from('users')
          .update({ 
            avatar_url: profileData.avatarUrl,
            avatar_source: 'url'
          })
          .eq('id', userData.user.id)

        if (userError) throw userError
      }

      // Update user_data (personal information)
      const userDataUpdate: any = {}
      if (profileData.firstName.trim()) userDataUpdate.first_name = profileData.firstName.trim()
      if (profileData.lastName.trim()) userDataUpdate.last_name = profileData.lastName.trim()
      if (profileData.country) userDataUpdate.country = profileData.country
      if (profileData.birthdate) userDataUpdate.birthdate = profileData.birthdate

      if (Object.keys(userDataUpdate).length > 0) {
        const { error: dataError } = await supabase
          .from('user_data')
          .update(userDataUpdate)
          .eq('user_id', userData.user.id)

        if (dataError) throw dataError
      }

      // Update user preferences
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .update({ sidebar_docked: profileData.sidebarDocked })
        .eq('id', userData.preferences.id)

      if (prefsError) throw prefsError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      setDocked(sidebarDocked)
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente"
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el perfil: ${error.message}`,
        variant: "destructive"
      })
    }
  })

  // Theme toggle mutation
  const toggleThemeMutation = useMutation({
    mutationFn: async () => {
      const currentTheme = userData?.preferences?.theme || 'light'
      const newTheme = currentTheme === 'light' ? 'dark' : 'light'
      
      if (!userData?.preferences?.id) {
        throw new Error('Missing preferences data')
      }
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ theme: newTheme })
        .eq('id', userData.preferences.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      toast({
        title: "Tema actualizado",
        description: "El tema se ha cambiado correctamente"
      })
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "No se pudo cambiar el tema",
        variant: "destructive"
      })
    }
  })

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      await signOut()
    },
    onSuccess: () => {
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente"
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive"
      })
    }
  })

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName,
      lastName,
      country,
      birthdate,
      avatarUrl,
      sidebarDocked
    })
  }

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUrlSubmit = () => {
    if (avatarUrlInput.trim()) {
      setAvatarUrl(avatarUrlInput.trim())
      setAvatarUrlInput('')
      setShowAvatarUpload(false)
    }
  }

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    if (userData?.user?.full_name) {
      const names = userData.user.full_name.split(' ')
      return names.length >= 2 
        ? `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase()
        : names[0].charAt(0).toUpperCase()
    }
    return userData?.user?.email?.charAt(0).toUpperCase() || 'U'
  }

  const headerProps = {
    title: "Perfil",
    showSearch: false,
    showFilters: false,
    actions: (
      <Button 
        onClick={handleSaveProfile}
        disabled={updateProfileMutation.isPending}
        className="h-8 px-3 text-sm"
      >
        {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    )
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="text-center text-muted-foreground">
          Cargando perfil...
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Camera className="w-5 h-5" />
            <CardTitle>Foto de perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-lg font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAvatarUpload(!showAvatarUpload)}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Cambiar foto
                </Button>
                <p className="text-xs text-muted-foreground">
                  Sube una imagen o proporciona una URL
                </p>
              </div>
            </div>

            {showAvatarUpload && (
              <div className="space-y-3 border rounded-lg p-4">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Subir archivo
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="mt-1"
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    URL de imagen
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    <Button size="sm" onClick={handleAvatarUrlSubmit}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <User className="w-5 h-5" />
            <CardTitle>Información personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre completo</Label>
                <Input
                  value={userData?.user?.full_name || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este campo no se puede editar
                </p>
              </div>
              <div>
                <Label>Mail</Label>
                <Input
                  value={userData?.user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este campo no se puede editar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <Label>Apellido</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>País</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Preferencias */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Settings className="w-5 h-5" />
            <CardTitle>Preferencias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tema */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Tema</Label>
                <div className="text-sm text-muted-foreground">
                  Elige entre tema claro u oscuro
                </div>
              </div>
              <Switch
                checked={userData?.preferences?.theme === 'dark'}
                onCheckedChange={toggleThemeMutation.mutate}
                disabled={toggleThemeMutation.isPending}
              />
            </div>

            {/* Sidebar fijo */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Sidebar Fijo</Label>
                <div className="text-sm text-muted-foreground">
                  Mantener el sidebar siempre visible
                </div>
              </div>
              <Switch
                checked={sidebarDocked}
                onCheckedChange={setSidebarDocked}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card de Cerrar Sesión */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <LogOut className="w-5 h-5" />
            <CardTitle>Cerrar Sesión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Al cerrar sesión, serás redirigido a la página de inicio de sesión.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Estás a punto de cerrar tu sesión. Tendrás que volver a iniciar sesión para acceder a tu cuenta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={signOutMutation.mutate}>
                    Cerrar Sesión
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}