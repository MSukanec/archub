import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CustomSearchButtonProps {
  value: string;
  onChange: (value: string) => void;
}

export function CustomSearchButton({ value, onChange }: CustomSearchButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleButtonClick = () => {
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleInputBlur = () => {
    if (!internalValue.trim()) {
      setIsExpanded(false);
    }
    onChange(internalValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
      onChange('');
      setInternalValue('');
    }
  };

  return (
    <div className="relative flex items-center">
      {isExpanded && (
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={internalValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="absolute right-10 h-10 w-64 transition-all duration-200 ease-in-out"
          style={{ zIndex: 10 }}
        />
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleButtonClick}
        className="h-10 w-10 rounded-full"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}