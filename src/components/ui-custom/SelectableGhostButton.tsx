import React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SelectableGhostButtonOption {
  value: string;
  label: string;
}

interface SelectableGhostButtonProps {
  defaultLabel: string;
  selectedValue?: string;
  options: SelectableGhostButtonOption[];
  onSelect: (value: string, option: SelectableGhostButtonOption) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
}

export function SelectableGhostButton({
  defaultLabel,
  selectedValue,
  options,
  onSelect,
  icon,
  disabled = false,
  placeholder,
}: SelectableGhostButtonProps) {
  // Encontrar la opción seleccionada
  const selectedOption = options.find(option => option.value === selectedValue);
  
  // Determinar el texto a mostrar
  const displayText = selectedOption ? selectedOption.label : defaultLabel;
  
  // Determinar el estilo del botón (hover si hay selección)
  const isSelected = !!selectedOption;
  const buttonVariant = isSelected ? "secondary" : "ghost";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={buttonVariant}
          size="sm"
          className="h-8 px-3 text-xs"
          disabled={disabled}
        >
          {icon && <span className="mr-1">{icon}</span>}
          <span>{displayText}</span>
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {placeholder && (
          <DropdownMenuItem
            onClick={() => onSelect("", { value: "", label: defaultLabel })}
            className={!selectedValue ? 'bg-[var(--accent)] text-white' : ''}
          >
            {placeholder}
          </DropdownMenuItem>
        )}
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSelect(option.value, option)}
            className={selectedValue === option.value ? 'bg-[var(--accent)] text-white' : ''}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}