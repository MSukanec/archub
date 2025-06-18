import { User, Camera, Settings } from 'lucide-react'
import { CustomPageLayout } from '@/components/ui-custom/CustomPageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useThemeStore } from '@/stores/themeStore'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type { Country } from '@/../../shared/schema'

export default function ProfilePage() {
  const { data, isLoading, error, refetch } = useCurrentUser()
  const { isDark, toggleTheme } = useThemeStore()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch countries from database
  const { data: countries, isLoading: countriesLoading } = useQuery({
    queryKey: ['/api/countries'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/countries')
      return await response.json() as Country[]
    }
  })
  
  const [formData, setFormData] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    birthdate: '',
    avatar_url: '',
    theme: 'light',
    sidebar_docked: true,
    country: ''
  })
  
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Initialize form data when user data loads
  useEffect(() => {
    if (data) {
      setFormData({
        full_name: data.user?.full_name || '',
        first_name: data.user?.first_name || '',
        last_name: data.user?.last_name || '',
        birthdate: data.user?.birthdate || '',
        avatar_url: data.user?.avatar_url || '',
        theme: data.preferences?.theme || 'light',
        sidebar_docked: data.preferences?.sidebar_docked || true,
        country: data.user?.country || ''
      })
      setAvatarPreview(data.user?.avatar_url || '')
    }
  }, [data])

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return await apiRequest('PATCH', '/api/user/profile', profileData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] })
      refetch()
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el perfil.",
        variant: "destructive"
      })
    }
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        toast({
          title: "Formato no válido",
          description: "Solo se permiten archivos JPG y PNG.",
          variant: "destructive"
        })
        return
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo debe ser menor a 2MB.",
          variant: "destructive"
        })
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setAvatarPreview(result)
        handleInputChange('avatar_url', result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlChange = (url: string) => {
    setAvatarUrl(url)
    if (url.trim()) {
      setAvatarPreview(url)
      handleInputChange('avatar_url', url)
    }
  }

  const handleThemeToggle = async () => {
    await toggleTheme(data?.user?.id, data?.preferences?.id)
    handleInputChange('theme', !isDark ? 'dark' : 'light')
  }

  const handleSave = () => {
    if (!data?.user?.id) {
      toast({
        title: "Error",
        description: "No se pudo obtener la información del usuario.",
        variant: "destructive"
      })
      return
    }

    // Clean data - only send non-empty values
    const profileData: any = {
      user_id: data.user.id
    }

    // Only include fields that have actual values
    if (formData.first_name && formData.first_name.trim()) {
      profileData.first_name = formData.first_name.trim()
    }
    if (formData.last_name && formData.last_name.trim()) {
      profileData.last_name = formData.last_name.trim()
    }
    if (formData.birthdate && formData.birthdate.trim()) {
      profileData.birthdate = formData.birthdate.trim()
    }
    if (formData.country && formData.country.trim()) {
      profileData.country = formData.country.trim()
    }
    if (formData.avatar_url) {
      profileData.avatar_url = formData.avatar_url
    }
    if (formData.theme) {
      profileData.theme = formData.theme
    }
    if (formData.sidebar_docked !== undefined) {
      profileData.sidebar_docked = formData.sidebar_docked
    }

    updateProfileMutation.mutate(profileData)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <CustomPageLayout
        icon={User}
        title="Mi Perfil"
        showSearch={false}
      >
        <div className="space-y-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-[var(--card-hover-bg)] rounded w-1/3"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 bg-[var(--card-hover-bg)] rounded w-full"></div>
              <div className="h-4 bg-[var(--card-hover-bg)] rounded w-2/3"></div>
            </CardContent>
          </Card>
        </div>
      </CustomPageLayout>
    )
  }

  if (error) {
    return (
      <CustomPageLayout
        icon={User}
        title="Mi Perfil"
        showSearch={false}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-[var(--destructive)] mb-2">Error al cargar el perfil</p>
              <p className="text-sm text-[var(--text-muted)]">
                {error.message || 'No se pudo conectar con la base de datos'}
              </p>
            </div>
          </CardContent>
        </Card>
      </CustomPageLayout>
    )
  }

  return (
    <CustomPageLayout
      icon={User}
      title="Mi Perfil"
      showSearch={false}
      actions={
        <Button 
          onClick={handleSave} 
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto de perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover border-2 border-[var(--card-border)]"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium text-lg">
                    {getInitials(data?.user?.full_name || data?.user?.email || 'U')}
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Subir imagen
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="avatar-url">O pegar URL de imagen</Label>
                  <Input
                    id="avatar-url"
                    placeholder="https://ejemplo.com/mi-foto.jpg"
                    value={avatarUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                  />
                </div>
                
                <p className="text-xs text-[var(--text-muted)]">
                  Formatos: JPG, PNG. Tamaño máximo: 2MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  disabled
                  className="opacity-60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="email"
                    value={data?.user?.email || ''}
                    disabled
                    className="opacity-60"
                  />
                  {data?.role && (
                    <Badge variant={data.role.name === 'admin' ? 'default' : 'secondary'}>
                      {data.role.name === 'admin' ? 'Administrador' : 'Usuario'}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Tu apellido"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate">Fecha de nacimiento</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => handleInputChange('birthdate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries?.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preferencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Tema de la interfaz</Label>
                  <p className="text-sm text-[var(--text-muted)]">
                    Cambia entre modo claro y oscuro
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Claro</span>
                  <Switch
                    checked={isDark}
                    onCheckedChange={handleThemeToggle}
                  />
                  <span className="text-sm">Oscuro</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Barra lateral fija</Label>
                  <p className="text-sm text-[var(--text-muted)]">
                    Mantener la barra lateral siempre visible
                  </p>
                </div>
                <Switch
                  checked={formData.sidebar_docked}
                  onCheckedChange={(checked) => handleInputChange('sidebar_docked', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomPageLayout>
  )
}