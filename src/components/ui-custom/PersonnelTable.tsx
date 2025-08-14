import { useState } from "react";
import { Edit, Trash2, UserX, MoreHorizontal, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table } from "@/components/ui-custom/Table";
import { EmptyState } from "@/components/ui-custom/EmptyState";

interface PersonnelRecord {
  id: string;
  notes?: string;
  created_at: string;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    contact_type_links?: Array<{
      contact_type: {
        name: string;
      };
    }>;
  };
}

interface PersonnelTableProps {
  personnel: PersonnelRecord[];
  isLoading?: boolean;
  onEdit?: (record: PersonnelRecord) => void;
  onDeactivate?: (record: PersonnelRecord) => void;
}



export function PersonnelTable({ 
  personnel, 
  isLoading = false, 
  onEdit, 
  onDeactivate 
}: PersonnelTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<PersonnelRecord | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  const handleDeactivateClick = (record: PersonnelRecord) => {
    setSelectedRecord(record);
    setShowDeactivateDialog(true);
  };

  const handleConfirmDeactivate = () => {
    if (selectedRecord && onDeactivate) {
      onDeactivate(selectedRecord);
    }
    setShowDeactivateDialog(false);
    setSelectedRecord(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  if (personnel.length === 0) {
    return (
      <EmptyState
        icon={<User className="h-12 w-12" />}
        title="Sin personal activo"
        description="No hay personal asignado a este proyecto. Agrega contactos como personal activo para comenzar."
      />
    );
  }

  const columns = [
    {
      key: "contact" as const,
      label: "Personal",
      className: "w-2/5"
    },
    {
      key: "contact_type" as const,
      label: "Tipo de Contacto",
      className: "w-1/4"
    },
    {
      key: "notes" as const,
      label: "Notas",
      className: "w-1/4"
    },
    {
      key: "created_at" as const,
      label: "Fecha de Ingreso",
      className: "w-1/6"
    },
    {
      key: "actions" as const,
      label: "",
      className: "w-16"
    }
  ];

  const formatCellData = (record: PersonnelRecord, key: string) => {
    switch (key) {
      case "contact":
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {record.contact.first_name?.charAt(0)}{record.contact.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {record.contact.first_name} {record.contact.last_name}
              </p>
            </div>
          </div>
        );
      
      case "notes":
        return (
          <span className="text-sm text-muted-foreground">
            {record.notes || 'Sin notas'}
          </span>
        );

      case "contact_type":
        const contactType = record.contact.contact_type_links?.[0]?.contact_type?.name || 'Sin tipo';
        return (
          <Badge variant="outline">
            {contactType}
          </Badge>
        );

      case "created_at":
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(record.created_at), "dd MMM yyyy", { locale: es })}
          </span>
        );

      case "actions":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(record)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar notas
                </DropdownMenuItem>
              )}
              {onDeactivate && (
                <DropdownMenuItem 
                  onClick={() => handleDeactivateClick(record)}
                  className="text-red-600 dark:text-red-400"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Table
        data={personnel}
        columns={columns}
        formatCellData={formatCellData}
        keyExtractor={(record) => record.id}
      />

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar personal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará a{' '}
              <strong>
                {selectedRecord?.contact.first_name} {selectedRecord?.contact.last_name}
              </strong>{' '}
              del proyecto. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}