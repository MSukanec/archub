import React, { useState } from 'react';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, MessageSquare, Paperclip, Clock, Plus, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { KanbanCard } from '@/hooks/use-kanban';
import { useKanbanComments, useKanbanAttachments, useCreateKanbanComment, useCreateKanbanAttachment } from '@/hooks/use-kanban';

interface CardDetailsModalProps {
  card: KanbanCard;
  open: boolean;
  onClose: () => void;
}

export function CardDetailsModal({ card, open, onClose }: CardDetailsModalProps) {
  const [newComment, setNewComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: comments = [], isLoading: commentsLoading } = useKanbanComments(card.id);
  const { data: attachments = [], isLoading: attachmentsLoading } = useKanbanAttachments(card.id);
  
  const createCommentMutation = useCreateKanbanComment();
  const createAttachmentMutation = useCreateKanbanAttachment();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        cardId: card.id,
        content: newComment.trim()
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await createAttachmentMutation.mutateAsync({
        cardId: card.id,
        file
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={card.title}
            description="Detalles de la tarjeta"
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <div className="space-y-6">
              {/* Card Description */}
              {card.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Descripción</h4>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </div>
              )}

              {/* Card Metadata */}
              <div className="grid grid-cols-2 gap-4">
                {/* Assigned User */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Asignado a</h4>
                  {card.assigned_user ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {card.assigned_user.avatar_url && (
                          <AvatarImage src={card.assigned_user.avatar_url} />
                        )}
                        <AvatarFallback className="text-xs">
                          {card.assigned_user.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{card.assigned_user.full_name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-sm">Sin asignar</span>
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Fecha límite</h4>
                  {card.due_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {format(new Date(card.due_date), 'dd MMMM yyyy', { locale: es })}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Sin fecha límite</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Comments Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Comentarios ({comments.length})</h4>
                </div>

                {/* Add Comment */}
                <div className="space-y-3 mb-4">
                  <Textarea
                    placeholder="Agregar un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || createCommentMutation.isPending}
                    size="sm"
                  >
                    {createCommentMutation.isPending ? 'Agregando...' : 'Agregar comentario'}
                  </Button>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {commentsLoading ? (
                    <div className="text-sm text-muted-foreground">Cargando comentarios...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No hay comentarios aún</div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          {comment.user?.avatar_url && (
                            <AvatarImage src={comment.user.avatar_url} />
                          )}
                          <AvatarFallback className="text-xs">
                            {comment.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {comment.user?.full_name || 'Usuario'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), 'dd MMM HH:mm', { locale: es })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              {/* Attachments Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <h4 className="text-sm font-medium">Archivos adjuntos ({attachments.length})</h4>
                  </div>
                  <label>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading || createAttachmentMutation.isPending}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUploading || createAttachmentMutation.isPending}
                      asChild
                    >
                      <span>
                        <Plus className="h-4 w-4 mr-2" />
                        {isUploading ? 'Subiendo...' : 'Subir archivo'}
                      </span>
                    </Button>
                  </label>
                </div>

                {/* Attachments List */}
                <div className="space-y-2">
                  {attachmentsLoading ? (
                    <div className="text-sm text-muted-foreground">Cargando archivos...</div>
                  ) : attachments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No hay archivos adjuntos</div>
                  ) : (
                    attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{attachment.filename}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.file_size)} • {format(new Date(attachment.created_at), 'dd MMM yyyy', { locale: es })}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.file_url, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Card Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>Creada el {format(new Date(card.created_at), 'dd MMMM yyyy HH:mm', { locale: es })}</span>
                </div>
                {card.updated_at && card.updated_at !== card.created_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Actualizada el {format(new Date(card.updated_at), 'dd MMMM yyyy HH:mm', { locale: es })}</span>
                  </div>
                )}
              </div>
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            cancelText="Cerrar"
          />
        )
      }}
    </CustomModalLayout>
  );
}