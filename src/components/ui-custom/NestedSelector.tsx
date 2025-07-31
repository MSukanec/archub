import React from 'react'
import { CascadingSelect } from './CascadingSelect'

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
  placeholder = "Seleccionar...",
  className = "" 
}: NestedSelectorProps) {
  // Transformar data a options para CascadingSelect
  const options = data.map(concept => ({
    value: concept.id,
    label: concept.name,
    children: concept.children?.map((category: any) => ({
      value: category.id,
      label: category.name,
      children: category.children?.map((subcategory: any) => ({
        value: subcategory.id,
        label: subcategory.name
      })) || []
    })) || []
  }))

  return (
    <CascadingSelect
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      className={className}
    />
  )
}