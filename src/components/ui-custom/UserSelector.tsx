import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
}

interface UserSelectorProps {
  users: User[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function UserSelector({
  users = [],
  value,
  onChange,
  label,
  placeholder = "Seleccionar usuario",
  required = false,
  disabled = false,
  className = ""
}: UserSelectorProps) {
  const selectedUser = users?.find(user => user.id === value);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selectedUser && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {selectedUser.full_name?.split(' ').map(n => n[0]).join('') || 
                     selectedUser.first_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {selectedUser.full_name || `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim()}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {users?.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {user.full_name?.split(' ').map(n => n[0]).join('') || 
                     user.first_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}