import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComboBoxOption {
  value: string
  label: string
}

interface ComboBoxWriteProps {
  options: ComboBoxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  allowCustomValues?: boolean
}

export function ComboBoxWrite({
  options = [],
  value,
  onValueChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  className,
  disabled = false,
  allowCustomValues = false
}: ComboBoxWriteProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [inputValue, setInputValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(option => option.value === value)
  const displayText = selectedOption?.label || value || placeholder

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (optionValue: string, optionLabel?: string) => {
    onValueChange?.(optionValue)
    setOpen(false)
    setSearchTerm('')
    setInputValue('')
  }

  const handleMouseEnter = () => {
    if (!disabled) {
      setOpen(true)
      // Focus input when opening
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 0)
    }
  }

  const handleMouseLeave = () => {
    setOpen(false)
    setSearchTerm('')
    setInputValue('')
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (allowCustomValues && searchTerm.trim()) {
        handleSelect(searchTerm.trim())
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0].value)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setSearchTerm('')
      setInputValue('')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSearchTerm('')
        setInputValue('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div 
      ref={containerRef}
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {/* Main button */}
      <button
        type="button"
        disabled={disabled}
        className={cn(
          // Base button styling identical to ghost variant
          "inline-flex items-center justify-between whitespace-nowrap transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0",
          "disabled:pointer-events-none disabled:opacity-60",
          // Ghost button styling exactly from buttonVariants (without hover translate)
          "bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)]",
          "hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)]",
          "rounded-lg px-4 py-2 shadow-button-normal hover:shadow-button-hover",
          "text-sm font-medium",
          "w-full min-w-0", // Full width and allow text truncation
          className
        )}
      >
        <span className="truncate text-left flex-1">{displayText}</span>
        <ChevronDown className={cn(
          "w-4 h-4 ml-2 shrink-0 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </button>
      
      {/* Expanded options */}
      {open && (
        <>
          {/* Invisible bridge to prevent hover gaps */}
          <div className="absolute top-full left-0 right-0 h-1 z-40" />
          
          <div 
            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg shadow-button-normal border"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              maxHeight: '240px' // Más alto para acomodar input + opciones
            }}
          >
            <div className="p-2 border-b" style={{ borderColor: 'var(--card-border)' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--button-ghost-text)]" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className={cn(
                    "w-full pl-10 pr-4 py-2 text-sm rounded-lg border",
                    "bg-[var(--card-bg)] text-[var(--button-ghost-text)]",
                    "border-[var(--card-border)] focus:border-[var(--accent)]",
                    "focus:outline-none focus:ring-1 focus:ring-[var(--accent)]",
                    "placeholder:text-[var(--button-ghost-text)]"
                  )}
                />
              </div>
            </div>
            
            <div 
              className="py-1 overflow-y-auto overflow-x-hidden"
              style={{
                maxHeight: '160px' // Scroll interno dentro del popover
              }}
            >
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value, option.label)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm font-medium transition-colors",
                    "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)]",
                    value === option.value && "bg-[var(--button-ghost-hover-bg)]",
                    "whitespace-nowrap", // Prevenir wrap de texto
                    "flex items-center justify-between"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value !== option.label && (
                    <span className="text-xs opacity-60 ml-2 shrink-0">
                      {option.value}
                    </span>
                  )}
                </button>
              ))}
              
              {/* Custom value option when allowCustomValues is true */}
              {allowCustomValues && searchTerm.trim() && !filteredOptions.some(opt => opt.value === searchTerm.trim()) && (
                <button
                  type="button"
                  onClick={() => handleSelect(searchTerm.trim())}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm font-medium transition-colors",
                    "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)]",
                    "border-t whitespace-nowrap flex items-center"
                  )}
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  <span className="truncate">Crear: "{searchTerm.trim()}"</span>
                </button>
              )}
              
              {filteredOptions.length === 0 && !allowCustomValues && (
                <div className="px-4 py-2 text-sm text-[var(--button-ghost-text)]">
                  No se encontraron opciones
                </div>
              )}
              
              {filteredOptions.length === 0 && allowCustomValues && !searchTerm.trim() && (
                <div className="px-4 py-2 text-sm text-[var(--button-ghost-text)]">
                  Escribe para buscar o crear
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}