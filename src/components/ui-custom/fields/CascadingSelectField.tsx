"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CascadingOption {
  value: string
  label: string
  children?: CascadingOption[]
}

interface CascadingSelectProps {
  options: CascadingOption[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CascadingSelect({
  options,
  value = [],
  onValueChange,
  placeholder = "Seleccionar...",
  className,
  disabled = false
}: CascadingSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(0)
  const [currentOptions, setCurrentOptions] = useState<CascadingOption[]>(options)
  const [selectedPath, setSelectedPath] = useState<CascadingOption[]>([])
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Estado para prevenir loops de sincronización
  const [isInternalUpdate, setIsInternalUpdate] = React.useState(false)

  // Sincronizar con el valor externo solo cuando NO es una actualización interna
  React.useEffect(() => {
    if (isInternalUpdate) {
      return // Saltar sincronización si es una actualización interna
    }

    if (value.length === 0) {
      setSelectedPath([])
      setCurrentLevel(0)
      setCurrentOptions(options)
      return
    }

    // Verificar si ya tenemos el path correcto
    const currentValues = selectedPath.map(item => item.value)
    if (value.length === currentValues.length && 
        value.every((val, index) => val === currentValues[index])) {
      return // Ya tenemos el path correcto
    }

    // Reconstruir el path basado en el valor externo
    const buildPath = (opts: CascadingOption[], vals: string[], path: CascadingOption[] = []): CascadingOption[] | null => {
      if (vals.length === 0) return path

      for (const option of opts) {
        if (option.value === vals[0]) {
          const newPath = [...path, option]
          if (vals.length === 1) return newPath
          if (option.children) {
            const result = buildPath(option.children, vals.slice(1), newPath)
            if (result) return result
          }
        }
      }
      return null
    }

    const path = buildPath(options, value)
    if (path && path.length > 0) {
      setSelectedPath(path)
    }
  }, [value, options, isInternalUpdate])

  // Reset del flag de actualización interna
  React.useEffect(() => {
    if (isInternalUpdate) {
      const timer = setTimeout(() => setIsInternalUpdate(false), 100)
      return () => clearTimeout(timer)
    }
  }, [isInternalUpdate])

  const getDisplayText = () => {
    if (selectedPath.length === 0) return placeholder
    return selectedPath.map(item => item.label).join(" / ")
  }

  const handleTriggerClick = () => {
    if (disabled) return
    if (!isOpen) {
      // Al abrir, establecer el nivel correcto basado en la selección actual
      if (selectedPath.length > 0) {
        const lastSelected = selectedPath[selectedPath.length - 1]
        if (lastSelected.children && lastSelected.children.length > 0) {
          // Si el último elemento tiene hijos, mostrar esos hijos
          setCurrentOptions(lastSelected.children)
          setCurrentLevel(selectedPath.length)
        } else {
          // Si no tiene hijos, mostrar el nivel padre
          if (selectedPath.length > 1) {
            const parent = selectedPath[selectedPath.length - 2]
            if (parent.children) {
              setCurrentOptions(parent.children)
              setCurrentLevel(selectedPath.length - 1)
            }
          } else {
            setCurrentLevel(0)
            setCurrentOptions(options)
          }
        }
      } else {
        setCurrentLevel(0)
        setCurrentOptions(options)
      }
    }
    setIsOpen(!isOpen)
  }

  const handleOptionClick = (option: CascadingOption) => {
    const newPath = [...selectedPath.slice(0, currentLevel), option]
    setSelectedPath(newPath)

    if (option.children && option.children.length > 0) {
      // Hay hijos, navegar al siguiente nivel
      setCurrentOptions(option.children)
      setCurrentLevel(currentLevel + 1)
    } else {
      // Es una opción final, seleccionar y cerrar
      setIsInternalUpdate(true) // Marcar como actualización interna
      const values = newPath.map(item => item.value)
      onValueChange?.(values)
      setIsOpen(false)
    }
  }

  const handleBack = () => {
    if (currentLevel > 0) {
      const newLevel = currentLevel - 1
      setCurrentLevel(newLevel)
      
      if (newLevel === 0) {
        setCurrentOptions(options)
        setSelectedPath([])
      } else {
        const parentOption = selectedPath[newLevel - 1]
        if (parentOption && parentOption.children) {
          setCurrentOptions(parentOption.children)
        }
        setSelectedPath(selectedPath.slice(0, newLevel))
      }
    }
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative">
      {/* Trigger - Estéticamente idéntico al Select */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between text-sm md:text-xs leading-tight py-2.5 md:py-2 px-3 md:px-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 [&>span]:line-clamp-1",
          selectedPath.length === 0 && "text-[var(--input-placeholder)]",
          className
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Icono de volver - solo visible si no estamos en el nivel raíz */}
          {currentLevel > 0 && isOpen && (
            <ArrowLeft 
              className="h-3 w-3 flex-shrink-0 opacity-50 cursor-pointer hover:opacity-100" 
              onClick={(e) => {
                e.stopPropagation()
                handleBack()
              }}
            />
          )}
          
          {/* Texto del valor seleccionado */}
          <span className="line-clamp-1 text-left">
            {getDisplayText()}
          </span>
        </div>
        
        {/* Chevron */}
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform flex-shrink-0",
          isOpen && "transform rotate-180"
        )} />
      </button>

      {/* Dropdown Content - Estéticamente idéntico al Select */}
      {isOpen && (
        <div
          ref={contentRef}
          className={cn(
            "absolute z-[100000] w-full mt-1 max-h-60 overflow-hidden rounded-md border border-[var(--card-border)] bg-[var(--popover-bg)] text-[var(--popover-fg)] shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
          )}
        >
          <div className="p-1 max-h-56 overflow-auto overscroll-contain">
            {currentOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handleOptionClick(option)}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent hover:text-accent-foreground focus:text-accent-foreground",
                  "cursor-pointer"
                )}
              >
                <span className="truncate">{option.label}</span>
                
                {/* Indicador de que tiene hijos */}
                {option.children && option.children.length > 0 && (
                  <ChevronDown className="ml-auto h-3 w-3 opacity-50 transform -rotate-90" />
                )}
              </div>
            ))}
            
            {currentOptions.length === 0 && (
              <div className="py-1.5 pl-8 pr-2 text-sm text-[var(--input-placeholder)]">
                No hay opciones disponibles
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}