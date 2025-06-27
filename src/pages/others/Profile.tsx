import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Camera, User, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useAuthStore } from '@/stores/authStore'

interface Country {
  id: string
  name: string
}

export default function Profile() {
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const { isExpanded, setExpanded } = useSidebarStore()

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [sidebarDocked, setSidebarDocked] = useState(false)

  // Load countries
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      return data as Country[]
    }
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!userData || !supabase) throw new Error('No user data')

      const profileData = {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        country: country || null,
        birthdate: birthdate || null,
        avatarUrl: avatarUrl.trim() || null,
        sidebarDocked
      }

      // Update user data
      const { error: userDataError } = await supabase
        .from('user_data')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          country: profileData.country,
          birthdate: profileData.birthdate
        })
        .eq('user_id', userData.user.id)

      if (userDataError) throw userDataError

      // Update user avatar
      const { error: userError } = await supabase
        .from('users')
        .update({ avatar_url: profileData.avatarUrl })
        .eq('id', userData.user.id)

      if (userError) throw userError

      // Update preferences
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .update({ sidebar_docked: profileData.sidebarDocked })
        .eq('id', userData.preferences.id)

      if (prefsError) throw prefsError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      setExpanded(sidebarDocked)
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente"
      })
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar perfil",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      })
    }
  })

  // Load user data into form
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

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center text-muted-foreground">
          Cargando perfil...
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mi Perfil</h1>
          <Button 
            onClick={() => updateProfileMutation.mutate()}
            disabled={updateProfileMutation.isPending}
            className="gap-2"
          >
            {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>

        {/* Avatar Section */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Camera className="w-5 h-5" />
            <CardTitle>Foto de perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>
                  {userData?.user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar-url">URL de imagen</Label>
                <Input
                  id="avatar-url"
                  type="url"
                  placeholder="https://ejemplo.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>
            </div>
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
                <Label htmlFor="first-name">Nombre</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="last-name">Apellido</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birthdate">Fecha de nacimiento</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="country">País</Label>
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
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Settings className="w-5 h-5" />
            <CardTitle>Preferencias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Sidebar fijo</Label>
                <p className="text-sm text-muted-foreground">
                  Mantener el sidebar siempre expandido
                </p>
              </div>
              <Switch
                checked={sidebarDocked}
                onCheckedChange={setSidebarDocked}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}