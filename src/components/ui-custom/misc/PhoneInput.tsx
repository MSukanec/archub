import React, { forwardRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Comprehensive list of countries with their phone codes and flags
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
];

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = '', onChange, placeholder = 'Número de teléfono', disabled, className }, ref) => {
    const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to Argentina
    const [phoneNumber, setPhoneNumber] = useState('');
    const [open, setOpen] = useState(false);

    // Parse initial value when component mounts or value changes
    useEffect(() => {
      if (value) {
        // Try to extract country code and number from the value
        const country = countries.find(c => value.startsWith(c.dialCode));
        if (country) {
          setSelectedCountry(country);
          setPhoneNumber(value.substring(country.dialCode.length).trim());
        } else {
          setPhoneNumber(value);
        }
      }
    }, [value]);

    // Update parent when country or number changes
    useEffect(() => {
      const fullNumber = phoneNumber ? `${selectedCountry.dialCode} ${phoneNumber}` : '';
      if (onChange && fullNumber !== value) {
        onChange(fullNumber);
      }
    }, [selectedCountry, phoneNumber, onChange, value]);

    const handleCountrySelect = (country: typeof countries[0]) => {
      setSelectedCountry(country);
      setOpen(false);
    };

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNumber = e.target.value;
      setPhoneNumber(newNumber);
    };

    return (
      <div className="relative">
        <div className="flex">
          {/* Country selector button */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={disabled}
                className={cn(
                  "flex h-10 items-center justify-center rounded-l-md rounded-r-none border-r-0 px-2 py-2 text-sm min-w-[80px]",
                  "bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-fg)]",
                  "hover:bg-[var(--input-hover-bg)] hover:border-[var(--input-hover-border)]",
                  "focus:bg-[var(--input-focus-bg)] focus:border-[var(--input-focus-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)]",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "transition-colors"
                )}
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm">{selectedCountry.flag}</span>
                  <span className="text-xs font-medium">{selectedCountry.code}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{selectedCountry.dialCode}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <div className="max-h-[200px] overflow-auto">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-[var(--accent-bg)] hover:text-[var(--accent-fg)]",
                      selectedCountry.code === country.code && "bg-[var(--accent-bg)] text-[var(--accent-fg)]"
                    )}
                  >
                    <span className="text-base">{country.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{country.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{country.dialCode}</div>
                    </div>
                    {selectedCountry.code === country.code && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Phone number input */}
          <Input
            ref={ref}
            type="tel"
            placeholder={placeholder}
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            disabled={disabled}
            className={cn(
              "rounded-l-none border-l-0 flex-1",
              className
            )}
          />
        </div>
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';