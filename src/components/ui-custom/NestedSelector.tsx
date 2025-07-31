import React, { useMemo } from 'react'
import { CascadingSelect } from './CascadingSelect'

interface NestedSelectorProps {
  data: any[]
  value: string[]
  onValueChange: (values: string[]) => void
  placeholder?: string
  className?: string
  isLoading?: boolean
}

export function NestedSelector({
  data,
  value,
  onValueChange,
  placeholder = "Seleccione...",
  className = "",
  isLoading = false
}: NestedSelectorProps) {
  // Transformar los datos de organizationConcepts al formato esperado por CascadingSelect
  const transformedOptions = useMemo(() => {
    return data.map(concept => ({
      value: concept.id,
      label: concept.name,
      children: concept.children?.map((child: any) => ({
        value: child.id,
        label: child.name,
        children: child.children?.map((grandchild: any) => ({
          value: grandchild.id,
          label: grandchild.name
        }))
      }))
    }))
  }, [data])

  if (isLoading) {
    return (
      <div className={`h-10 bg-muted animate-pulse rounded-md ${className}`} />
    )
  }

  return (
    <CascadingSelect
      options={transformedOptions}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      className={className}
    />
  )
}