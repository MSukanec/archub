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


      </CardContent>
    </Card>
  );
}