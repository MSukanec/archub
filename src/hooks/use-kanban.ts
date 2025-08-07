import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { toast } from '@/hooks/use-toast'

export interface KanbanBoard {
  id: string
  name: string
  description?: string
  organization_id: string
  project_id?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface KanbanList {
  id: string
  board_id: string
  name: string
  position: number
  color?: string
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  creator?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

export interface KanbanCard {
  id: string
  list_id: string
  title: string
  description?: string
  assigned_to?: string
  due_date?: string
  position: number
  is_completed: boolean
  completed_at?: string
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  assigned_user?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  creator?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

export interface KanbanComment {
  id: string
  card_id: string
  content: string
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  user?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

export interface KanbanAttachment {
  id: string
  card_id: string
  filename: string
  file_url: string
  file_size: number
  mime_type: string
  uploaded_by: string
  created_at: string
}

// Hook to get boards for current organization
export function useKanbanBoards() {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id

  return useQuery({
    queryKey: ['kanban-boards', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required')

      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as KanbanBoard[]
    },
    enabled: !!organizationId
  })
}

// Hook to get lists for a specific board
export function useKanbanLists(boardId: string) {
  return useQuery({
    queryKey: ['kanban-lists', boardId],
    queryFn: async () => {
      if (!boardId) throw new Error('Board ID required')

      const { data, error } = await supabase
        .from('kanban_lists')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true })

      if (error) throw error
      
      // If we have lists, fetch user data for creators
      if (data && data.length > 0) {
        const userIds = new Set<string>()
        data.forEach(list => {
          if (list.created_by) userIds.add(list.created_by)
        })

        if (userIds.size > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, email, avatar_url')
            .in('id', Array.from(userIds))

          if (!usersError && users) {
            const userMap = users.reduce((acc, user) => {
              acc[user.id] = user
              return acc
            }, {} as Record<string, any>)

            // Attach user data to lists
            return data.map(list => ({
              ...list,
              creator: list.created_by ? userMap[list.created_by] : undefined
            })) as KanbanList[]
          }
        }
      }

      return data as KanbanList[]
    },
    enabled: !!boardId
  })
}

// Hook to get cards for a specific board
export function useKanbanCards(boardId: string) {
  return useQuery({
    queryKey: ['kanban-cards', boardId],
    queryFn: async () => {
      if (!boardId) throw new Error('Board ID required')
      if (!supabase) throw new Error('Supabase not initialized')

      console.log('Fetching cards for board:', boardId)

      // First get all list IDs for this board
      const { data: lists, error: listsError } = await supabase
        .from('kanban_lists')
        .select('id')
        .eq('board_id', boardId)

      if (listsError) {
        console.error('Error fetching lists:', listsError)
        throw listsError
      }

      const listIds = lists?.map(list => list.id) || []
      console.log('List IDs found:', listIds)

      if (listIds.length === 0) {
        console.log('No lists found for board, returning empty array')
        return []
      }

      // Then get all cards for those lists (without relations for now)
      const { data, error } = await supabase
        .from('kanban_cards')
        .select('*')
        .in('list_id', listIds)
        .order('position', { ascending: true })

      if (error) {
        console.error('Error fetching cards:', error)
        throw error
      }

      console.log('Cards fetched:', data?.length || 0, 'cards')
      
      // If we have cards, fetch user data for creators and assigned users
      if (data && data.length > 0) {
        const userIds = new Set<string>()
        data.forEach(card => {
          if (card.created_by) userIds.add(card.created_by)
          if (card.assigned_to) userIds.add(card.assigned_to)
        })

        if (userIds.size > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, email, avatar_url')
            .in('id', Array.from(userIds))

          if (!usersError && users) {
            const userMap = users.reduce((acc, user) => {
              acc[user.id] = user
              return acc
            }, {} as Record<string, any>)

            // Attach user data to cards
            return data.map(card => ({
              ...card,
              creator: card.created_by ? userMap[card.created_by] : undefined,
              assigned_user: card.assigned_to ? userMap[card.assigned_to] : undefined
            })) as KanbanCard[]
          }
        }
      }

      return data as KanbanCard[]
    },
    enabled: !!boardId
  })
}

// Hook to get comments for a specific card
export function useKanbanComments(cardId: string) {
  return useQuery({
    queryKey: ['kanban-comments', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error('Card ID required')

      const { data, error } = await supabase
        .from('kanban_comments')
        .select(`
          *,
          user:users!kanban_comments_created_by_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('card_id', cardId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as KanbanComment[]
    },
    enabled: !!cardId
  })
}

// Hook to get attachments for a specific card
export function useKanbanAttachments(cardId: string) {
  return useQuery({
    queryKey: ['kanban-attachments', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error('Card ID required')

      const { data, error } = await supabase
        .from('kanban_attachments')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as KanbanAttachment[]
    },
    enabled: !!cardId
  })
}

// Mutation to create a new board
export function useCreateKanbanBoard() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (boardData: { name: string; description?: string }) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization required')
      }

      const { data, error } = await supabase
        .from('kanban_boards')
        .insert({
          name: boardData.name,
          description: boardData.description,
          organization_id: userData.organization.id,
          created_by: userData.user.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] })
      toast({ title: "Tablero creado exitosamente" })
    },
    onError: (error) => {
      toast({ 
        title: "Error al crear tablero",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

// Update kanban board
export function useUpdateKanbanBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (boardData: { id: string; name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('kanban_boards')
        .update({ 
          name: boardData.name,
          description: boardData.description 
        })
        .eq('id', boardData.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] })
      toast({ title: "Tablero actualizado exitosamente" })
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar tablero",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

// Delete kanban board
export function useDeleteKanbanBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase
        .from('kanban_boards')
        .delete()
        .eq('id', boardId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] })
      toast({ title: "Tablero eliminado exitosamente" })
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar tablero",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

// Delete kanban card
export function useDeleteKanbanCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cardId, boardId }: { cardId: string; boardId: string }) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('id', cardId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards', variables.boardId] })
      toast({ title: "Tarjeta eliminada exitosamente" })
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar tarjeta",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

// Mutation to create a new list
export function useCreateKanbanList() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (listData: { board_id: string; name: string; created_by?: string }) => {
      if (!supabase) throw new Error('Supabase not initialized')
      if (!userData?.user?.id) throw new Error('User not authenticated')
      
      // Get next position
      const { data: lists } = await supabase
        .from('kanban_lists')
        .select('position')
        .eq('board_id', listData.board_id)
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = (lists?.[0]?.position || 0) + 1

      const { data, error } = await supabase
        .from('kanban_lists')
        .insert({
          board_id: listData.board_id,
          name: listData.name,
          created_by: userData.user.id, // Use current user's ID directly
          position: nextPosition
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-lists', variables.board_id] })
      toast({ title: "Lista creada exitosamente" })
    },
    onError: (error) => {
      console.error('Error creating kanban list:', error)
      toast({
        title: "Error al crear lista",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

// Update kanban list
export function useUpdateKanbanList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (listData: { id: string; name: string; board_id: string; created_by?: string }) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('kanban_lists')
        .update({ 
          name: listData.name
          // Don't update created_by during edit - preserve original creator
        })
        .eq('id', listData.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-lists', variables.board_id] })
      toast({ title: "Lista actualizada exitosamente" })
    },
    onError: (error) => {
      console.error('Error updating kanban list:', error)
      toast({
        title: "Error al actualizar lista",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

// Delete kanban list
export function useDeleteKanbanList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (listId: string) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      // Get the board_id first for cache invalidation
      const { data: listData, error: listError } = await supabase
        .from('kanban_lists')
        .select('board_id')
        .eq('id', listId)
        .single()

      if (listError) throw listError
      const boardId = listData.board_id

      // First delete all cards in the list
      const { error: cardsError } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('list_id', listId)

      if (cardsError) throw cardsError

      // Then delete the list
      const { error } = await supabase
        .from('kanban_lists')
        .delete()
        .eq('id', listId)

      if (error) throw error
      return { listId, boardId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-lists', data.boardId] })
      queryClient.invalidateQueries({ queryKey: ['kanban-cards', data.boardId] })
      toast({ title: "Lista eliminada exitosamente" })
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar lista",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

// Mutation to create a new card
export function useCreateKanbanCard() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (cardData: { 
      list_id: string; 
      title: string; 
      description?: string; 
      created_by: string;
      assigned_to?: string;
      due_date?: string;
    }) => {
      if (!userData?.user?.id) throw new Error('User required')
      
      // Get next position in list
      const { data: cards } = await supabase
        .from('kanban_cards')
        .select('position')
        .eq('list_id', cardData.list_id)
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = (cards?.[0]?.position || 0) + 1

      const { data, error } = await supabase
        .from('kanban_cards')
        .insert({
          list_id: cardData.list_id,
          title: cardData.title,
          description: cardData.description,
          position: nextPosition,
          created_by: cardData.created_by,
          assigned_to: cardData.assigned_to,
          due_date: cardData.due_date
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Get board_id from list to invalidate correct queries
      supabase
        .from('kanban_lists')
        .select('board_id')
        .eq('id', data.list_id)
        .single()
        .then(({ data: listData }) => {
          if (listData) {
            queryClient.invalidateQueries({ queryKey: ['kanban-cards', listData.board_id] })
          }
        })
      toast({ title: "Tarjeta creada exitosamente" })
    },
    onError: (error) => {
      toast({
        title: "Error al crear tarjeta",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

// Mutation to move a card between lists
export function useMoveKanbanCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      cardId, 
      newListId, 
      newPosition, 
      boardId 
    }: { 
      cardId: string; 
      newListId: string; 
      newPosition: number;
      boardId: string;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('kanban_cards')
        .update({ 
          list_id: newListId, 
          position: newPosition
        })
        .eq('id', cardId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards', variables.boardId] })
    },
    onError: (error) => {
      console.error('Error moving card:', error)
      toast({
        title: "Error al mover tarjeta",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

// Update kanban card
export function useUpdateKanbanCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cardData: { 
      id: string;
      title: string; 
      description?: string; 
      assigned_to?: string;
      due_date?: string;
      list_id: string;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('kanban_cards')
        .update({
          title: cardData.title,
          description: cardData.description,
          assigned_to: cardData.assigned_to,
          due_date: cardData.due_date
        })
        .eq('id', cardData.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Get board_id from list to invalidate correct queries
      supabase
        ?.from('kanban_lists')
        .select('board_id')
        .eq('id', data.list_id)
        .single()
        .then(({ data: listData }) => {
          if (listData?.board_id) {
            queryClient.invalidateQueries({ queryKey: ['kanban-cards', listData.board_id] })
          }
        })
      toast({ title: "Tarjeta actualizada exitosamente" })
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar tarjeta",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

// Mutation to add a comment
export function useCreateKanbanComment() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async ({ cardId, content }: { cardId: string; content: string }) => {
      if (!userData?.user?.id) throw new Error('User required')

      const { data, error } = await supabase
        .from('kanban_comments')
        .insert({
          card_id: cardId,
          content,
          created_by: userData.user.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-comments', variables.cardId] })
      toast({ title: "Comentario agregado exitosamente" })
    },
    onError: (error) => {
      toast({
        title: "Error al agregar comentario",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

// Mutation to upload attachment
export function useCreateKanbanAttachment() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async ({ 
      cardId, 
      file 
    }: { 
      cardId: string; 
      file: File;
    }) => {
      if (!userData?.user?.id) throw new Error('User required')

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `kanban-attachments/${cardId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath)

      // Save attachment record
      const { data, error } = await supabase
        .from('kanban_attachments')
        .insert({
          card_id: cardId,
          filename: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: userData.user.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-attachments', variables.cardId] })
      toast({ title: "Archivo subido exitosamente" })
    },
    onError: (error) => {
      toast({
        title: "Error al subir archivo",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

// Hook to update last kanban board preference
export function useUpdateLastKanbanBoard() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (boardId: string) => {
      if (!userData?.preferences?.id) throw new Error('User preferences required')
      if (!supabase) throw new Error('Supabase not initialized')

      const { data, error } = await supabase
        .from('user_preferences')
        .update({ last_kanban_board_id: boardId })
        .eq('id', userData.preferences.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate current user data to refresh preferences
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
    onError: (error) => {
      console.error('Error updating last kanban board:', error)
    }
  })
}

// Toggle completed status for kanban card
export function useToggleKanbanCardCompleted() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      cardId, 
      isCompleted, 
      boardId 
    }: { 
      cardId: string; 
      isCompleted: boolean;
      boardId: string;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const updateData: { is_completed: boolean; completed_at?: string } = {
        is_completed: isCompleted,
      }
      
      if (isCompleted) {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = undefined
      }

      const { data, error } = await supabase
        .from('kanban_cards')
        .update(updateData)
        .eq('id', cardId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards', variables.boardId] })
      toast({ 
        title: variables.isCompleted ? "Tarea completada" : "Tarea reactivada"
      })
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar tarea",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}