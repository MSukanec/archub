import React, { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ColorFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const ColorField = forwardRef<HTMLInputElement, ColorFieldProps>(
  ({ value, onChange, placeholder = '#000000', disabled, className }, ref) => {
    // Función para convertir nombres de colores CSS a hex
    const colorNameToHex = (colorName: string): string => {
      const colorMap: { [key: string]: string } = {
        'red': '#ff0000',
        'green': '#008000',
        'blue': '#0000ff',
        'yellow': '#ffff00',
        'cyan': '#00ffff',
        'magenta': '#ff00ff',
        'orange': '#ffa500',
        'purple': '#800080',
        'pink': '#ffc0cb',
        'brown': '#a52a2a',
        'gray': '#808080',
        'grey': '#808080',
        'black': '#000000',
        'white': '#ffffff',
        'lime': '#00ff00',
        'navy': '#000080',
        'maroon': '#800000',
        'olive': '#808000',
        'teal': '#008080',
        'silver': '#c0c0c0',
        'gold': '#ffd700',
        'indigo': '#4b0082',
        'violet': '#ee82ee',
        'turquoise': '#40e0d0',
        'coral': '#ff7f50',
        'salmon': '#fa8072',
        'crimson': '#dc143c',
        'khaki': '#f0e68c',
        'plum': '#dda0dd',
        'orchid': '#da70d6',
        'tan': '#d2b48c',
        'beige': '#f5f5dc',
        'mint': '#98ff98',
        'lavender': '#e6e6fa',
        'ivory': '#fffff0'
      };
      return colorMap[colorName.toLowerCase()] || colorName;
    };

    // Función para normalizar el valor del color
    const normalizeColor = (inputValue: string): string => {
      if (!inputValue) return "#ffffff";
      
      const trimmed = inputValue.trim().toLowerCase();
      
      // Si es un nombre de color, convertir a hex
      const hexFromName = colorNameToHex(trimmed);
      if (hexFromName !== trimmed) {
        return hexFromName;
      }
      
      // Si no tiene #, agregarlo
      if (!trimmed.startsWith('#')) {
        // Validar que sea un código hex válido (3 o 6 caracteres)
        if (/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(trimmed)) {
          return `#${trimmed}`;
        }
      }
      
      // Si ya tiene # y es válido, devolverlo
      if (/^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(trimmed)) {
        return trimmed;
      }
      
      // Si no es válido, mantener el valor original
      return inputValue;
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      onChange(inputValue);
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    const handleBlur = () => {
      const normalized = normalizeColor(value || "");
      if (normalized !== value) {
        onChange(normalized);
      }
    };

    const displayValue = value || "#ffffff";
    const isValidColor = /^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(displayValue);

    return (
      <div className={cn("flex", className)}>
        {/* Color Picker Button - Siguiendo el patrón de CurrencyAmountField */}
        <div
          className={cn(
            "flex w-[60px] items-center justify-center border border-[var(--input-border)] bg-[var(--input-bg)] rounded-l-md transition-all duration-150",
            "border-r-0 p-2",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        >
          <input
            type="color"
            value={isValidColor ? displayValue : "#ffffff"}
            onChange={handleColorChange}
            disabled={disabled}
            className="w-8 h-6 rounded border-0 cursor-pointer disabled:cursor-not-allowed"
            style={{ background: 'none' }}
          />
        </div>

        {/* Text Input - Siguiendo el patrón de CurrencyAmountField */}
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "rounded-l-none border-l-0 flex-1",
            !isValidColor && displayValue && "border-yellow-500 focus-visible:ring-yellow-500",
            className
          )}
        />
      </div>
    );
  }
);

ColorField.displayName = 'ColorField';