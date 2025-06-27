import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { CalendarIcon, User, Search } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface User {
  id: string
  auth_id: string
  full_name: string
  email: string
  avatar_url: string
  created_at: string
  is_active: boolean
  user_data?: {
    first_name: string
    last_name: string
    country: string
  }
  organizations_count: number
  last_activity_at: string
}

interface NewAdminUserModalProps {
  open: boolean
  onClose: () => void
  user?: User | null
}

export function NewAdminUserModal({ open, onClose, user }: NewAdminUserModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isActive, setIsActive] = useState('true')
  const [countryId, setCountryId] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserSearch, setShowUserSearch] = useState(false)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const isEditing = !!user

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && !user) {
      // Reset for new user
      setSelectedDate(new Date())
      setFullName('')
      setEmail('')
      setFirstName('')
      setLastName('')
      setAvatarUrl('')
      setIsActive('true')
      setCountryId('')
      setCreatedBy('')
      setSearchQuery('')
      setShowUserSearch(false)
    }
  }, [open, user])

  // Fetch countries
  const { data: countries } = useQuery({
    queryKey: ['admin-countries'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
        .order('name', { ascending: true })
      
      if (error) throw error
      return data || []
    }
  })

  // User search for creator field
  const { data: searchResults } = useQuery({
    queryKey: ['admin-user-search', searchQuery],
    queryFn: async () => {
      if (!supabase || searchQuery.length < 3) return []
      
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .eq('is_active', true)
        .limit(10)
      
      if (error) throw error
      return data || []
    },
    enabled: searchQuery.length >= 3
  })

  // Set initial values when user is provided
  useEffect(() => {
    if (user) {
      console.log('Setting initial user values:', user)
      setFullName(user.full_name || '')
      setEmail(user.email || '')
      setSelectedDate(new Date(user.created_at))
      setFirstName(user.user_data?.first_name || '')
      setLastName(user.user_data?.last_name || '')
      setAvatarUrl(user.avatar_url || '')
      setIsActive(user.is_active.toString())
      setCountryId(user.user_data?.country || '')
      setCreatedBy('') // Sistema created
    }
  }, [user])

  // Create/Update user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      if (isEditing) {
        // Update existing user
        const { error: userError } = await supabase
          .from('users')
          .update({
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            is_active: userData.is_active
          })
          .eq('id', user!.id)
        
        if (userError) throw userError

        // Update user_data if exists
        if (userData.first_name || userData.last_name || userData.country) {
          const { error: dataError } = await supabase
            .from('user_data')
            .upsert({
              user_id: user!.id,
              first_name: userData.first_name,
              last_name: userData.last_name,
              country: userData.country || null
            })
          
          if (dataError) throw dataError
        }
      } else {
        // Create new user - this would typically be done through Supabase Auth
        // For now, we'll show a message that users are created through registration
        throw new Error('Los usuarios se crean automáticamente durante el registro. Use esta funcionalidad solo para editar usuarios existentes.')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] })
      toast({
        title: isEditing ? 'Usuario actualizado' : 'Usuario creado',
        description: `El usuario ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente.`,
      })
      onClose()
    },
    onError: (error) => {
      console.error('Error saving user:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el usuario.',
        variant: 'destructive',
      })
    }
  })

  const handleSubmit = () => {
    if (!fullName.trim() || !email.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor complete todos los campos requeridos.',
        variant: 'destructive',
      })
      return
    }

    createUserMutation.mutate({
      full_name: fullName.trim(),
      email: email.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      avatar_url: avatarUrl.trim(),
      is_active: isActive === 'true',
      country: countryId || null,
      created_at: selectedDate.toISOString()
    })
  }

  const selectUser = (selectedUser: any) => {
    setCreatedBy(selectedUser.id)
    setSearchQuery(selectedUser.full_name || selectedUser.email)
    setShowUserSearch(false)
  }

  const selectedCreator = searchResults?.find(u => u.id === createdBy)

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            description={isEditing ? 'Modifica la información del usuario seleccionado.' : 'Crea un nuevo usuario en el sistema.'}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <div className="space-y-4">
              {/* Fecha de creación */}
              <div className="space-y-2">
                <Label htmlFor="created_at" className="required-asterisk">
                  Fecha de creación
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={isEditing} // No editable in edit mode
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Creador */}
              <div className="space-y-2">
                <Label htmlFor="created_by">Creador</Label>
                <div className="relative">
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        SY
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Sistema</span>
                      <span className="text-xs text-muted-foreground">Registro automático</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nombre completo */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="required-asterisk">
                  Nombre completo
                </Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ingrese el nombre completo"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="required-asterisk">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  disabled={isEditing} // Email no editable
                />
              </div>

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input
                    id="last_name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Apellido"
                  />
                </div>
              </div>

              {/* País */}
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Select value={countryId} onValueChange={setCountryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un país" />
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

              {/* Avatar URL */}
              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL del Avatar</Label>
                <Input
                  id="avatar_url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://ejemplo.com/avatar.jpg"
                />
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="is_active" className="required-asterisk">
                  Estado
                </Label>
                <Select value={isActive} onValueChange={setIsActive}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending 
                ? (isEditing ? 'Actualizando...' : 'Creando...') 
                : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')
              }
            </Button>
          </CustomModalFooter>
        )
      }}
    </CustomModalLayout>
  )
}