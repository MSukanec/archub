import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreHorizontal, CheckCircle } from "lucide-react";

type ContactCardDesktopProps = {
  contact: {
    id: string;
    first_name: string;
    last_name?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    company_name?: string;
    contact_types?: Array<{
      type_id: string;
      contact_type?: {
        id: string;
        name: string;
      };
    }>;
    linked_user_id?: string;
    linked_user?: {
      id: string;
      full_name: string;
      email: string;
      avatar_url?: string;
    };
  };
  onEdit?: (contact: any) => void;
  onDelete?: (contact: any) => void;
  onClick?: (contact: any) => void;
  isSelected?: boolean;
};

// Utility function to get initials from name
const getInitials = (name: string): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const ContactCardDesktop: React.FC<ContactCardDesktopProps> = ({
  contact,
  onEdit,
  onDelete,
  onClick,
  isSelected = false,
}) => {
  const {
    first_name,
    last_name,
    full_name,
    email,
    phone,
    contact_types,
    linked_user,
  } = contact;

  // Determine display name - prioritize full_name, fallback to first_name + last_name
  const displayName = full_name || `${first_name} ${last_name || ""}`.trim();

  // Get avatar and name from linked user if available
  const avatar = linked_user?.avatar_url || "";
  const avatarFallback = linked_user
    ? getInitials(linked_user.full_name)
    : getInitials(displayName);

  return (
    <Card
      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => onClick?.(contact)}
    >
      <div className="flex items-center gap-3">
        {/* Avatar y información principal */}
        <div className="flex items-center gap-2 flex-1">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">
              {displayName}
            </h3>
            {linked_user && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="text-xs text-muted-foreground">Usuario de Archub</span>
              </div>
            )}
            {contact_types && contact_types.length > 0 && !linked_user && (
              <div className="flex gap-1 flex-wrap">
                {contact_types.slice(0, 2).map((typeLink: any, index: number) => (
                  <Badge key={`${typeLink.type_id}-${index}`} variant="secondary" className="text-xs px-1.5 py-0.5 h-4">
                    {typeLink.contact_type?.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Información de contacto */}
        <div className="flex-1 min-w-0">
          {email && (
            <div className="text-xs text-muted-foreground truncate" title={email}>
              {email}
            </div>
          )}
          {phone && (
            <div className="text-xs text-muted-foreground truncate" title={phone}>
              {phone}
            </div>
          )}
          {!email && !phone && (
            <div className="text-xs text-muted-foreground">
              Sin información de contacto
            </div>
          )}
        </div>

        {/* Menú de opciones */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(contact);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(contact);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

export default ContactCardDesktop;