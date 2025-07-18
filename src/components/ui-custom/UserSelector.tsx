import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  user_id?: string; // Para organizationMembers que usan user_id
  full_name?: string;
  email?: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
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
  showCompany?: boolean;
}

export default function UserSelector({
  users = [],
  value,
  onChange,
  label,
  placeholder = "Seleccionar usuario",
  required = false,
  disabled = false,
  className = "",
  showCompany = false
}: UserSelectorProps) {
  const selectedUser = users?.find(user => user.id === value);

  const getUserDisplayName = (user: User) => {
    const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return showCompany && user.company_name ? `${fullName} (${user.company_name})` : fullName;
  };

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
            {selectedUser && getUserDisplayName(selectedUser)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {users?.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {getUserDisplayName(user)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}