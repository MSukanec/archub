import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface OnlineUser {
  user_id: string
  full_name: string | null
  avatar_url: string | null
  current_view: string | null
  last_seen_at: string
  is_online: boolean
}

interface PresenceState {
  // Estado actual
  currentView: string | null
  onlineUsers: OnlineUser[]
  isSubscribed: boolean
  
  // Canal de suscripción (para cleanup)
  presenceChannel: RealtimeChannel | null
  
  // Acciones
  setCurrentView: (view: string) => Promise<void>
  fetchOnlineUsers: () => Promise<void>
  subscribeToPresenceChanges: () => void
  unsubscribe: () => void
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  currentView: null,
  onlineUsers: [],
  isSubscribed: false,
  presenceChannel: null,

  /**
   * Actualiza la vista actual del usuario
   * Llama a la RPC presence_set_view para actualizar en la BD
   */
  setCurrentView: async (view: string) => {
    try {
      // Validar que el usuario esté autenticado
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        console.warn('⚠️ Usuario no autenticado, no se puede actualizar current_view')
        return
      }

      // Actualizar estado local inmediatamente
      set({ currentView: view })

      // Llamar a la función RPC para actualizar en la BD
      const { error } = await supabase.rpc('presence_set_view', { 
        p_view: view 
      })

      if (error) {
        console.error('❌ Error actualizando current_view:', error)
      } else {
        console.log('✅ Current view actualizada:', view)
      }
    } catch (err) {
      console.error('❌ Error en setCurrentView:', err)
    }
  },

  /**
   * Obtiene la lista de usuarios online
   * Hace JOIN de user_presence con users para obtener datos completos
   */
  fetchOnlineUsers: async () => {
    try {
      const ninetySecondsAgo = new Date(Date.now() - 90000).toISOString()

      // Query con JOIN manual (sin vista users_online)
      const { data, error } = await supabase
        .from('user_presence')
        .select(`
          user_id,
          current_view,
          last_seen_at,
          users!inner (
            full_name,
            avatar_url
          )
        `)
        .gte('last_seen_at', ninetySecondsAgo)
        .order('last_seen_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching online users:', error)
        return
      }

      // Transformar datos al formato esperado
      const onlineUsers: OnlineUser[] = (data || []).map((item: any) => ({
        user_id: item.user_id,
        full_name: item.users?.full_name || 'Usuario',
        avatar_url: item.users?.avatar_url || null,
        current_view: item.current_view,
        last_seen_at: item.last_seen_at,
        is_online: true // Si está en este query, está online
      }))

      set({ onlineUsers })
      console.log(`✅ ${onlineUsers.length} usuarios online`)
    } catch (err) {
      console.error('❌ Error en fetchOnlineUsers:', err)
    }
  },

  /**
   * Suscribirse a cambios en tiempo real de user_presence
   * Se ejecuta automáticamente cuando alguien se conecta/desconecta o cambia de vista
   */
  subscribeToPresenceChanges: () => {
    const { presenceChannel, isSubscribed } = get()

    // Evitar múltiples suscripciones
    if (isSubscribed || presenceChannel) {
      console.warn('⚠️ Ya estamos suscritos a presence changes')
      return
    }

    // Crear canal de suscripción
    const channel = supabase
      .channel('user_presence_realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          console.log('🔔 Cambio en user_presence:', payload)
          // Re-fetch usuarios online cuando hay cambios
          get().fetchOnlineUsers()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscrito a cambios de presencia en tiempo real')
          set({ isSubscribed: true })
        }
      })

    set({ presenceChannel: channel })

    // Fetch inicial
    get().fetchOnlineUsers()
  },

  /**
   * Desuscribirse de cambios (cleanup)
   */
  unsubscribe: () => {
    const { presenceChannel } = get()

    if (presenceChannel) {
      supabase.removeChannel(presenceChannel)
      set({ 
        presenceChannel: null, 
        isSubscribed: false,
        onlineUsers: []
      })
      console.log('🔌 Desuscrito de presence changes')
    }
  }
}))
