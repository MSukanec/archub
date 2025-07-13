import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DesignDocumentGroup } from '@/hooks/use-design-document-groups';
import { useDesignDocuments } from '@/hooks/use-design-documents';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  FolderOpen, 
  FileText, 
  Calendar, 
  User, 
  ChevronRight,
  Edit3,
  Trash2
} from 'lucide-react';

interface DocumentGroupCardProps {
  group: DesignDocumentGroup;
  onEdit?: (group: DesignDocumentGroup) => void;
  onDelete?: (group: DesignDocumentGroup) => void;
  onViewDocuments?: (group: DesignDocumentGroup) => void;
}

export function DocumentGroupCard({ 
  group, 
  onEdit, 
  onDelete, 
  onViewDocuments 
}: DocumentGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: documents = [] } = useDesignDocuments(group.id);

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && onViewDocuments) {
      onViewDocuments(group);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent/10">
              <FolderOpen className="w-5 h-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">{group.name}</CardTitle>
              <CardDescription className="text-sm">
                {group.description || 'Sin descripción'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              {group.document_count || 0} archivo{(group.document_count || 0) !== 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpanded}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDistanceToNow(new Date(group.created_at), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>Creado por {group.created_by}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(group);
                }}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(group);
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Expanded content showing documents */}
        {isExpanded && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-3">Documentos en esta entrega:</h4>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No hay documentos en esta entrega
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.file_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {doc.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="h-6 text-xs px-2"
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}