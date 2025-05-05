import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { LucideSearch } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  initialValue?: string;
  className?: string;
}

export function SearchInput({ placeholder = "Buscar...", onSearch, initialValue = "", className = "" }: SearchInputProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(value);
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [value, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <LucideSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
