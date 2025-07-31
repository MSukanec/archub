import React, { useState, useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'

interface NestedSelectorProps {
  data: any[]
  value: string[]
  onValueChange: (values: string[]) => void
  placeholder?: string
  className?: string
}

export function NestedSelector({ 
  data, 
  value, 
  onValueChange, 
  placeholder = "Tipo > Categoría > Subcategoría...",
  className = "" 
}: NestedSelectorProps) {
  const [currentLevel, setCurrentLevel] = useState(0)
  const [selectedPath, setSelectedPath] = useState<string[]>([])
  const [displayText, setDisplayText] = useState<string>('')

  // Sincronizar con el valor externo
  useEffect(() => {
    if (value && value.length > 0) {
      setSelectedPath(value)
      setCurrentLevel(value.length)
      updateDisplayText(value)
    } else {
      setSelectedPath([])
      setCurrentLevel(0)
      setDisplayText('')
    }
  }, [value])

  // Función para actualizar el texto mostrado
  const updateDisplayText = (path: string[]) => {
    if (path.length === 0) {
      setDisplayText('')
      return
    }

    const labels: string[] = []
    let currentData = data

    for (let i = 0; i < path.length; i++) {
      const item = currentData.find((item: any) => item.id === path[i])
      if (item) {
        labels.push(item.name)
        currentData = item.children || []
      }
    }

    setDisplayText(labels.join(' > '))
  }

  // Obtener opciones para el nivel actual
  const getCurrentOptions = () => {
    let currentData = data
    
    // Navegar hasta el nivel current
    for (let i = 0; i < currentLevel; i++) {
      const selectedItem = currentData.find((item: any) => item.id === selectedPath[i])
      if (selectedItem && selectedItem.children) {
        currentData = selectedItem.children
      } else {
        return []
      }
    }

    return currentData
  }

  // Manejar selección
  const handleSelection = (selectedId: string) => {
    const newPath = [...selectedPath.slice(0, currentLevel), selectedId]
    setSelectedPath(newPath)
    
    // Buscar el item seleccionado para ver si tiene hijos
    const currentOptions = getCurrentOptions()
    const selectedItem = currentOptions.find((item: any) => item.id === selectedId)
    
    if (selectedItem && selectedItem.children && selectedItem.children.length > 0) {
      // Si tiene hijos, avanzar al siguiente nivel
      setCurrentLevel(currentLevel + 1)
      updateDisplayText(newPath)
    } else {
      // Si no tiene hijos, completar la selección
      setCurrentLevel(newPath.length)
      updateDisplayText(newPath)
      onValueChange(newPath)
    }
  }

  // Volver al nivel anterior
  const goBack = () => {
    if (currentLevel > 0) {
      const newLevel = currentLevel - 1
      const newPath = selectedPath.slice(0, newLevel)
      
      setCurrentLevel(newLevel)
      setSelectedPath(newPath)
      updateDisplayText(newPath)
      
      if (newPath.length === 0) {
        onValueChange([])
      }
    }
  }

  // Limpiar selección
  const clearSelection = () => {
    setSelectedPath([])
    setCurrentLevel(0)
    setDisplayText('')
    onValueChange([])
  }

  const currentOptions = getCurrentOptions()
  const isAtRoot = currentLevel === 0
  const hasSelection = selectedPath.length > 0

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Texto de selección actual */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={displayText || ''}
            placeholder={placeholder}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            readOnly
            onClick={() => {
              // Si hay selección, empezar desde el nivel 0 para reseleccionar
              if (hasSelection) {
                setCurrentLevel(0)
              }
            }}
          />
        </div>
        {hasSelection && (
          <button
            type="button"
            onClick={clearSelection}
            className="ml-2 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>

      {/* Selector dinámico - solo mostrar si hay opciones o no estamos en root */}
      {(currentOptions.length > 0 || !isAtRoot) && (
        <div className="space-y-2">
          {/* Botón volver */}
          {!isAtRoot && (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver
            </button>
          )}

          {/* Select del nivel actual */}
          {currentOptions.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleSelection(e.target.value)
                }
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {isAtRoot ? 'Seleccionar tipo...' : 
                 currentLevel === 1 ? 'Seleccionar categoría...' : 
                 'Seleccionar subcategoría...'}
              </option>
              {currentOptions.map((option: any) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  )
}