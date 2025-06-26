import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CustomPhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomPhoneInput({ 
  value = '', 
  onChange, 
  placeholder = "Número de teléfono", 
  className,
  disabled = false 
}: CustomPhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={cn("flex", className)}>
      <div className="flex items-center gap-2 px-3 py-2 border border-r-0 rounded-l-md bg-muted">
        <span className="text-lg">🇦🇷</span>
        <span className="text-sm font-medium">AR</span>
      </div>
      <Input
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="rounded-l-none border-l-0 focus:border-l"
        disabled={disabled}
      />
    </div>
  );
}