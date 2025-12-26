import React from "react";
import { User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface UserSelectorFieldProps {
  users: User[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function UserSelectorField({
  users,
  value,
  onChange,
  placeholder = "Seleccionar usuario",
  className = ""
}: UserSelectorFieldProps) {
  // Ordenar usuarios alfabéticamente por nombre
  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a, b) => {
      const nameA = (a.full_name || '').toLowerCase();
      const nameB = (b.full_name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users]);

  const selectedUser = sortedUsers.find(user => user.id === value);

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
        {sortedUsers.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{user.full_name || 'Sin nombre'}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}