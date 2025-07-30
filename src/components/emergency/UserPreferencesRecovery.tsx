import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserPreferencesRecoveryProps {
  userId: string
  onRecoveryComplete: () => void
}

export function UserPreferencesRecovery({ userId, onRecoveryComplete }: UserPreferencesRecoveryProps) {
  const [isRecovering, setIsRecovering] = useState(false)
  const { toast } = useToast()

  const handleRecoverPreferences = async () => {
    setIsRecovering(true)
    
    try {
      
      // Create new user_preferences record with default values
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          theme: 'light',
          sidebar_docked: false,
          last_organization_id: '1cba2323-c7a8-4e0e-916c-442b3c91b687', // Your organization ID
          last_project_id: '5fd4cc23-624e-4787-94fc-ae647edc2344', // Your project ID
          last_budget_id: null,
          last_user_type: 'organization',
          onboarding_completed: true
        })
        .select()
        .single()

      if (error) {
        
        // If record already exists, try to update it
        if (error.code === '23505') { // unique_violation
          const { data: updateData, error: updateError } = await supabase
            .from('user_preferences')
            .update({
              theme: 'light',
              sidebar_docked: false,
              last_organization_id: '1cba2323-c7a8-4e0e-916c-442b3c91b687',
              last_project_id: '5fd4cc23-624e-4787-94fc-ae647edc2344',
              last_user_type: 'organization',
              onboarding_completed: true
            })
            .eq('user_id', userId)
            .select()
            .single()

          if (updateError) {
            throw updateError
          }
          
        } else {
          throw error
        }
      } else {
      }

      toast({
        title: "Preferencias restauradas",
        description: "Se han restaurado las preferencias del usuario exitosamente",
      })

      // Wait a moment then refresh
      setTimeout(() => {
        onRecoveryComplete()
      }, 1000)

    } catch (error) {
      toast({
        title: "Error al restaurar",
        description: "No se pudieron restaurar las preferencias. Contacta al soporte.",
        variant: "destructive"
      })
    } finally {
      setIsRecovering(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
          <CardTitle className="text-xl">Datos de Usuario Perdidos</CardTitle>
          <CardDescription>
            Se detectó que faltan las preferencias de usuario. Esto puede ocurrir por:
            <br />• Problemas de sincronización con la base de datos
            <br />• Conflictos durante actualizaciones
            <br />• Errores en funciones de base de datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">¿Qué vamos a hacer?</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Recrear las preferencias con valores seguros</li>
              <li>• Restaurar acceso a organización y proyecto</li>
              <li>• Mantener configuración de tema</li>
              <li>• Marcar onboarding como completado</li>
            </ul>
          </div>

          <Button 
            onClick={handleRecoverPreferences} 
            disabled={isRecovering}
            className="w-full"
          >
            {isRecovering ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Restaurando...
              </>
            ) : (
              'Restaurar Preferencias'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Esta acción es segura y no eliminará otros datos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}