import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function SearchField({ 
  value, 
  onChange, 
  placeholder = "Buscar...", 
  label,
  className = ""
}: SearchFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-xs font-medium leading-none text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}