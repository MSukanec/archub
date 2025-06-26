import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Camera, User, Settings, LogOut } from 'lucide-react'

import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

import { useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'

// Schema de validación para el formulario
const profileSchema = z.object({
  full_name: z.string(),
  email: z.string().email(),
  first_name: z.string().min(1, 'El primer nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  birthdate: z.string().optional(),
  country: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface Country {
  id: string
  name: string
  code: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function Profile() {
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const themeStore = useThemeStore()
  const { signOut } = useAuthStore()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
      first_name: '',
      last_name: '',
      birthdate: '',
      country: '',
    },
  })

  // Cargar países desde Supabase
  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      if (!supabase) return []
      
      const { data, error } = await supabase
        .from('countries')
        .select('id, name, code')
        .order('name')

      if (error) {
        console.error('Error cargando países:', error)
        return []
      }

      return data || []
    },
  })

  // Cargar datos del usuario en el formulario
  useEffect(() => {
    if (userData) {
      form.reset({
        full_name: userData.user?.full_name || '',
        email: userData.user?.email || '',
        first_name: userData.user_data?.first_name || '',
        last_name: userData.user_data?.last_name || '',
        birthdate: userData.user_data?.birthdate || '',
        country: userData.user_data?.country || '',
      })
    }
  }, [userData, form])

  // Mutación para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: ProfileFormData) => {
      if (!supabase || !userData?.user?.id) {
        throw new Error('No se puede actualizar el perfil')
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.user.id,
          first_name: formData.first_name?.trim() || null,
          last_name: formData.last_name?.trim() || null,
          birthdate: formData.birthdate || null,
          country: formData.country || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Error actualizando perfil')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente.",
      })
    },
    onError: (error) => {
      console.error('Error actualizando perfil:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      })
    }
  })

  // Mutación para subir avatar
  const uploadMutation = useMutation({
    mutationFn: async ({ type, file, url }: { type: 'file' | 'url'; file?: File; url?: string }) => {
      if (!supabase || !userData?.user?.id) {
        throw new Error('No se puede subir el avatar')
      }

      let avatarUrl = ''

      if (type === 'file' && file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userData.user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('user-avatars')
          .upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        const { data } = supabase.storage
          .from('user-avatars')
          .getPublicUrl(filePath)

        avatarUrl = data.publicUrl
      } else if (type === 'url' && url) {
        avatarUrl = url
      }

      const { error } = await supabase
        .from('users')
        .update({ 
          avatar_url: avatarUrl,
          avatar_source: type === 'file' ? 'upload' : 'url'
        })
        .eq('id', userData.user.id)

      if (error) {
        throw error
      }

      return avatarUrl
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      toast({
        title: "Avatar actualizado",
        description: "La foto de perfil se ha actualizado correctamente.",
      })
    },
    onError: (error) => {
      console.error('Error subiendo avatar:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la foto de perfil.",
        variant: "destructive",
      })
    }
  })

  // Mutación para cambiar sidebar_docked
  const sidebarDockedMutation = useMutation({
    mutationFn: async (sidebar_docked: boolean) => {
      if (!supabase || !userData?.user?.id) {
        throw new Error('No se puede actualizar la preferencia')
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({ sidebar_docked })
        .eq('user_id', userData.user.id)

      if (error) {
        console.error('Error actualizando sidebar_docked:', error)
        throw error
      }

      return sidebar_docked
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      toast({
        title: "Preferencia actualizada",
        description: "La configuración del sidebar se ha guardado correctamente.",
      })
    },
    onError: (error) => {
      console.error('Error actualizando sidebar_docked:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la preferencia del sidebar.",
        variant: "destructive",
      })
    }
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadMutation.mutate({ type: 'file', file })
    }
  }

  const handleUrlUpload = () => {
    if (avatarUrl) {
      uploadMutation.mutate({ type: 'url', url: avatarUrl })
      setAvatarUrl('')
    }
  }

  const handleSidebarDockedChange = (checked: boolean) => {
    sidebarDockedMutation.mutate(checked)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión.",
        variant: "destructive",
      })
    }
  }

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data)
  }

  const headerProps = {
    icon: User,
    title: "Perfil",
    showSearch: false,
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Card de Avatar */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              <CardTitle>Foto de Perfil</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={userData?.user?.avatar_url} />
              <AvatarFallback className="text-lg">
                {getInitials(userData?.user?.full_name || '')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Subiendo...' : 'Subir archivo'}
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">URL</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-2">
                    <Label>URL de imagen</Label>
                    <Input
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    <Button
                      onClick={handleUrlUpload}
                      disabled={!avatarUrl || uploadMutation.isPending}
                      className="w-full"
                    >
                      Usar URL
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Card de Información Personal */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <CardTitle>Información Personal</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="profile-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre Completo - Solo lectura */}
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-muted" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email - Solo lectura */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-muted" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primer Nombre */}
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primer Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Apellido */}
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fecha de Nacimiento */}
                  <FormField
                    control={form.control}
                    name="birthdate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Nacimiento</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* País */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un país" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.id} value={country.id}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Card de Preferencias */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <CardTitle>Preferencias</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Tema */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Tema</Label>
                  <div className="text-sm text-muted-foreground">
                    Elige entre tema claro u oscuro
                  </div>
                </div>
                <Switch
                  checked={themeStore.theme === 'dark'}
                  onCheckedChange={(checked) => themeStore.setTheme(checked ? 'dark' : 'light')}
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
                  checked={userData?.preferences?.sidebar_docked || false}
                  onCheckedChange={handleSidebarDockedChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Cerrar Sesión */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              <CardTitle>Cerrar Sesión</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                    <AlertDialogAction onClick={handleSignOut}>
                      Cerrar Sesión
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}