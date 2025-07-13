import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DesignDocumentGroup } from '@/hooks/use-design-document-groups';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  FolderOpen, 
  FileText, 
  Calendar, 
  User, 
  Edit3,
  Trash2
} from 'lucide-react';

interface DocumentGroupCardProps {
  group: DesignDocumentGroup;
  onEdit?: (group: DesignDocumentGroup) => void;
  onDelete?: (group: DesignDocumentGroup) => void;
}

export function DocumentGroupCard({ 
  group, 
  onEdit, 
  onDelete
}: DocumentGroupCardProps) {

  return (
    <Card className="w-full">
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <FolderOpen className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {/* Primera línea: Nombre + Versión */}
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold truncate">{group.name}</h3>
                <Badge variant="outline" className="text-xs flex-shrink-0">v1</Badge>
              </div>
              
              {/* Segunda línea: Creador + Tiempo */}
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-muted-foreground">
                  Creado por {group.created_by || 'Usuario'}
                </span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(group.created_at), { 
                    addSuffix: true, 
                    locale: es 
                  })}
                </span>
              </div>
            </div>
          </div>
          
          {/* Botones de acción a la derecha */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="secondary" className="text-xs mr-2">
              <FileText className="w-3 h-3 mr-1" />
              {group.document_count || 0} archivo{(group.document_count || 0) !== 1 ? 's' : ''}
            </Badge>
            
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(group);
                }}
                className="h-8 w-8 p-0"
                title="Editar grupo"
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
                title="Eliminar grupo"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}