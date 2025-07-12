import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface DesignDocument {
  id: string;
  file_name: string;
  description?: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  version_number: number;
  project_id: string;
  organization_id: string;
  design_phase_id?: string;
  folder: string;
  status: string;
  visibility?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

interface UpdateDocumentVersionModalProps {
  open: boolean;
  onClose: () => void;
  latestDocument: DesignDocument;
}

export function UpdateDocumentVersionModal({
  open,
  onClose,
  latestDocument
}: UpdateDocumentVersionModalProps) {
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    created_by: userData?.user?.id || '',
    file_name: latestDocument.file_name,
    description: latestDocument.description || '',
    status: 'pendiente'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get organization members for creator dropdown
  const { data: members = [] } = useQuery({
    queryKey: ['organizationMembers', userData?.preferences?.last_organization_id],
    queryFn: async () => {
      if (!supabase || !userData?.preferences?.last_organization_id) return [];

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          users!inner (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', userData.preferences.last_organization_id);

      if (error) throw error;
      return data.map(member => member.users).flat();
    },
    enabled: !!userData?.preferences?.last_organization_id && !!supabase,
  });

  const updateVersionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');
      
      setIsSubmitting(true);
      
      // Calculate next version number
      const nextVersion = latestDocument.version_number + 1;
      
      // Upload file to Supabase Storage
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('design-documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get file URL
      const { data: { publicUrl } } = supabase.storage
        .from('design-documents')
        .getPublicUrl(fileName);

      // Save document metadata
      const { data, error } = await supabase
        .from('design_documents')
        .insert({
          file_name: formData.file_name,
          description: formData.description,
          file_path: fileName,
          file_url: publicUrl,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          version_number: nextVersion,
          project_id: latestDocument.project_id,
          organization_id: latestDocument.organization_id,
          design_phase_id: latestDocument.design_phase_id,
          folder: latestDocument.folder,
          status: formData.status,
          visibility: latestDocument.visibility,
          created_by: formData.created_by
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designDocuments'] });
      toast({
        title: "Nueva versión creada",
        description: `Se ha creado la versión ${latestDocument.version_number + 1} del documento.`,
      });
      onClose();
      setSelectedFile(null);
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Error creating new version:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la nueva versión del documento.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    // Reset input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Debes seleccionar un archivo.",
        variant: "destructive",
      });
      return;
    }
    updateVersionMutation.mutate();
  };

  const selectedMember = members.find(member => member.id === formData.created_by);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Actualizar Documento</DialogTitle>
            <DialogDescription>
              Crear nueva versión de "{latestDocument.file_name}" en carpeta "{latestDocument.folder}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
          <div className="space-y-6">
            {/* Current Version Info */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Versión actual:</span>
                <Badge variant="outline">v{latestDocument.version_number}</Badge>
                <span className="text-sm text-muted-foreground">→</span>
                <Badge variant="default">v{latestDocument.version_number + 1} (nueva)</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Carpeta: {latestDocument.folder} | Estado actual: {latestDocument.status}
              </p>
            </div>

            {/* Creator */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Creador <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.created_by} onValueChange={(value) => setFormData(prev => ({ ...prev, created_by: value }))}>
                <SelectTrigger>
                  <SelectValue>
                    {selectedMember ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={selectedMember.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {selectedMember.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{selectedMember.full_name}</span>
                      </div>
                    ) : (
                      "Seleccionar creador"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {member.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.full_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Name */}
            <div className="space-y-2">
              <Label htmlFor="file_name" className="text-sm font-medium">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="file_name"
                value={formData.file_name}
                onChange={(e) => setFormData(prev => ({ ...prev, file_name: e.target.value }))}
                placeholder="Nombre del documento"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del documento (opcional)"
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Estado <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_revision">En Revisión</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Archivo <span className="text-red-500">*</span>
              </Label>
              {!selectedFile ? (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent transition-colors">
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.dwg,.doc,.docx,.xls,.xlsx"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Seleccionar archivo</span>
                    <span className="text-xs text-muted-foreground">
                      Imágenes, PDF, DWG, Word, Excel
                    </span>
                  </label>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedFile}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Creando...' : 'Crear Versión'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}