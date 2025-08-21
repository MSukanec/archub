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
  title: string; // El título principal que siempre aparece (ej: "Fases", "Categorías")
  showChevron?: boolean; // Opcional: mostrar chevron (por defecto false)
}

export function SelectableGhostButton({
  defaultLabel,
  selectedValue,
  options,
  onSelect,
  icon,
  disabled = false,
  placeholder,
  title,
  showChevron = false,
}: SelectableGhostButtonProps) {
  // Encontrar la opción seleccionada
  const selectedOption = options.find(option => option.value === selectedValue);
  
  // Determinar la opción seleccionada a mostrar
  const selectedLabel = selectedOption ? selectedOption.label : defaultLabel;
  
  // Determinar el estilo del botón (hover si hay selección)
  // Solo aplicar hover si hay una selección real (no "none" o vacío)
  const isSelected = !!selectedOption && selectedValue !== "none" && selectedValue !== "";
  
  // Usar clases de hover cuando esté seleccionado para mantener el estilo ghost
  const buttonClassName = isSelected 
    ? "h-8 px-3 text-xs bg-[var(--button-ghost-hover-bg)] text-[var(--button-ghost-hover-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)]"
    : "h-8 px-3 text-xs";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={buttonClassName}
          disabled={disabled}
        >
          {icon && <span style={{ marginRight: '0.2em' }}>{icon}</span>}
          <span className="font-medium">{title}:</span>
          <span style={{ marginLeft: '0.2em' }} className="font-normal">{selectedLabel}</span>
          {showChevron && <ChevronDown className="w-3 h-3" style={{ marginLeft: '0.2em' }} />}
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