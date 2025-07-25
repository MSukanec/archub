import React from "react";
import { User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface UserSelectorProps {
  users: User[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function UserSelector({
  users,
  value,
  onChange,
  placeholder = "Seleccionar usuario",
  className = ""
}: UserSelectorProps) {
  const selectedUser = users.find(user => user.id === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          {selectedUser ? (
            <>
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{selectedUser.full_name || 'Sin nombre'}</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{placeholder}</span>
            </>
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{user.full_name || 'Sin nombre'}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}