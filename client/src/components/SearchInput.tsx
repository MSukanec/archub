import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch: (term: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchInput({
  onSearch,
  placeholder = "Buscar...",
  debounceMs = 300,
  className,
  ...props
}: SearchInputProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Manejar el cambio del input con debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Limpiar cualquier timeout anterior
    const timeoutId = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    // Limpiar el timeout si el componente se desmonta o el usuario sigue escribiendo
    return () => clearTimeout(timeoutId);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        className="pl-8"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}