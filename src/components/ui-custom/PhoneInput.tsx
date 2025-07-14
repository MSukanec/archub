import React, { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lista de países con códigos de discado y banderas
const countries = [
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'FR', name: 'Francia', dialCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', dialCode: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', dialCode: '+39', flag: '🇮🇹' },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
  { code: 'JP', name: 'Japón', dialCode: '+81', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, placeholder = 'Número de teléfono', disabled, className }, ref) => {
    const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default: Argentina
    const [open, setOpen] = useState(false);

    const handleCountrySelect = (country: typeof countries[0]) => {
      setSelectedCountry(country);
      setOpen(false);
      // No cambia el número de teléfono, solo el país seleccionado
    };

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      // Validación básica: solo números, espacios y guiones
      const cleanValue = newValue.replace(/[^\d\s-]/g, '');
      onChange(cleanValue);
    };

    return (
      <div className="flex">
        {/* Botón selector de país */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "flex items-center justify-center rounded-l-md rounded-r-none border-r-0 min-w-[85px]",
                "text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground",
                "transition-all duration-150",
                "hover:bg-[var(--input-bg)] hover:border-[var(--input-border)]",
                "focus:bg-[var(--input-bg)] focus:border-[var(--input-border)]",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{selectedCountry.flag}</span>
                <span className="text-xs font-bold">{selectedCountry.code} {selectedCountry.dialCode}</span>
                <ChevronDown className="h-3 w-3 opacity-50 ml-0.5" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[280px] p-0 border-[var(--input-border)]" 
            align="start"
            style={{
              boxShadow: 'none'
            }}
          >
            <div className="max-h-[200px] overflow-auto">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-xs text-left",
                    "hover:bg-[var(--accent-bg)] hover:text-[var(--accent-fg)]",
                    selectedCountry.code === country.code && 
                    "bg-[var(--accent-bg)] text-[var(--accent-fg)]"
                  )}
                >
                  <span className="text-xs">{country.flag}</span>
                  <span className="flex-1 font-medium text-xs">{country.name}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {country.dialCode}
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Input de número de teléfono */}
        <Input
          ref={ref}
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={handlePhoneNumberChange}
          disabled={disabled}
          className={cn(
            "rounded-l-none border-l-0 flex-1",
            className
          )}
        />
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';