import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, User, MessageSquare, Paperclip, Plus, Send } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface DesignTask {
  id?: string;
  title: string;
  description?: string;
  phase_id: string;
  parent_id?: string;
  assigned_to?: string;
  start_date?: string;
  end_date?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  position: number;
  project_id: string;
  organization_id: string;
  created_by: string;
}

interface Comment {
  id: string;
  task_id: string;
  content: string;
  created_by: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface Attachment {
  id: string;
  task_id: string;
  filename: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

interface DesignTaskModalProps {
  task?: DesignTask;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function DesignTaskModal({ task, isOpen, onClose, onSave }: DesignTaskModalProps) {
  const [formData, setFormData] = useState<Partial<DesignTask>>({
    title: '',
    description: '',
    phase_id: '',
    assigned_to: '',
    start_date: '',
    end_date: '',
    status: 'todo',
    priority: 'medium',
    position: 0
  });
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.organization?.id;
  const currentMember = userData?.memberships?.find(m => m.organization_id === organizationId);

  // Load form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        ...task
      });
    } else {
      setFormData({
        title: '',
        description: '',
        phase_id: '',
        assigned_to: '',
        start_date: '',
        end_date: '',
        status: 'todo',
        priority: 'medium',
        position: 0
      });
    }
  }, [task]);

  // Fetch design phases for dropdown
  const { data: phases = [] } = useQuery({
    queryKey: ['design-phases', projectId],
    queryFn: async () => {
      if (!supabase || !projectId) return [];
      
      const { data, error } = await supabase
        .from('design_phases')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('position');
      
      if (error) {
        // Return mock data for development
        return [
          { id: '1', name: 'Anteproyecto', position: 1 },
          { id: '2', name: 'Proyecto Ejecutivo', position: 2 }
        ];
      }
      
      return data;
    },
    enabled: !!projectId && isOpen,
  });

  // Fetch organization members for assignment
  const { data: members = [] } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          users(id, full_name, email, avatar_url)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching organization members:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!organizationId && isOpen,
  });

  // Fetch comments for existing task
  const { data: comments = [] } = useQuery({
    queryKey: ['design-task-comments', task?.id],
    queryFn: async () => {
      if (!supabase || !task?.id) return [];
      
      const { data, error } = await supabase
        .from('kanban_comments')
        .select(`
          *,
          user:organization_members!created_by(
            id,
            users(id, full_name, email, avatar_url)
          )
        `)
        .eq('card_id', task.id)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }
      
      return data as Comment[];
    },
    enabled: !!task?.id && isOpen,
  });

  // Fetch attachments for existing task
  const { data: attachments = [] } = useQuery({
    queryKey: ['design-task-attachments', task?.id],
    queryFn: async () => {
      if (!supabase || !task?.id) return [];
      
      const { data, error } = await supabase
        .from('kanban_attachments')
        .select('*')
        .eq('card_id', task.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching attachments:', error);
        return [];
      }
      
      return data as Attachment[];
    },
    enabled: !!task?.id && isOpen,
  });

  // Create/Update task mutation
  const saveTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<DesignTask>) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const payload = {
        ...taskData,
        project_id: projectId,
        organization_id: organizationId,
        created_by: currentMember?.id || taskData.created_by
      };

      if (task?.id) {
        // Update existing task
        const { data, error } = await supabase
          .from('design_tasks')
          .update(payload)
          .eq('id', task.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('design_tasks')
          .insert(payload)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: task?.id ? "Tarea actualizada" : "Tarea creada",
        description: "Los cambios han sido guardados correctamente."
      });
      queryClient.invalidateQueries({ queryKey: ['design-tasks'] });
      onSave();
    },
    onError: (error) => {
      console.error('Error saving task:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea. Intenta nuevamente.",
        variant: "destructive"
      });
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!supabase || !task?.id) throw new Error('Invalid parameters');
      
      const { data, error } = await supabase
        .from('kanban_comments')
        .insert({
          card_id: task.id,
          content,
          created_by: currentMember?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['design-task-comments', task?.id] });
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!formData.title?.trim()) {
      toast({
        title: "Error",
        description: "El título es obligatorio.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.phase_id) {
      toast({
        title: "Error",
        description: "Debes seleccionar una fase.",
        variant: "destructive"
      });
      return;
    }

    saveTaskMutation.mutate(formData);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      todo: 'Por hacer',
      in_progress: 'En progreso',
      review: 'En revisión',
      done: 'Completado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {task?.id ? 'Editar Tarea' : 'Nueva Tarea'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="comments" disabled={!task?.id}>
              Comentarios ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="attachments" disabled={!task?.id}>
              Archivos ({attachments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nombre de la tarea"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phase">Fase *</Label>
                <Select
                  value={formData.phase_id || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, phase_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar fase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción detallada de la tarea"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha de inicio</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha de fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Responsable</Label>
                <Select
                  value={formData.assigned_to || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.users?.full_name || member.users?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status || 'todo'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Por hacer</SelectItem>
                    <SelectItem value="in_progress">En progreso</SelectItem>
                    <SelectItem value="review">En revisión</SelectItem>
                    <SelectItem value="done">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={formData.priority || 'medium'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="flex-1 overflow-auto space-y-4">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user?.avatar_url} />
                    <AvatarFallback>
                      {comment.user?.full_name?.charAt(0) || comment.user?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.user?.full_name || comment.user?.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="flex-1 overflow-auto space-y-4">
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm">{attachment.filename}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(attachment.file_size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Descargar
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Subir archivo
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveTaskMutation.isPending}
          >
            {saveTaskMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}