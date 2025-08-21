import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, ChevronDown, ChevronRight, MoreVertical, Folder, FolderOpen } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export interface HierarchicalItem {
  id: string
  name: string
  description?: string
  parent_id?: string
  is_system?: boolean
  created_at?: string
  children?: HierarchicalItem[]
  [key: string]: any // Allow additional properties
}

interface HierarchicalTreeProps {
  items: HierarchicalItem[]
  isLoading?: boolean
  emptyMessage?: string
  searchValue?: string
  onEdit?: (item: HierarchicalItem) => void
  onDelete?: (item: HierarchicalItem) => void
  renderItemBadges?: (item: HierarchicalItem) => React.ReactNode
  renderItemDetails?: (item: HierarchicalItem) => React.ReactNode
  showSystemBadge?: boolean
  allowDelete?: (item: HierarchicalItem) => boolean
  className?: string
}

export function HierarchicalTree({
  items,
  isLoading = false,
  emptyMessage = "No hay elementos disponibles",
  searchValue = "",
  onEdit,
  onDelete,
  renderItemBadges,
  renderItemDetails,
  showSystemBadge = true,
  allowDelete = () => true,
  className = ""
}: HierarchicalTreeProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const renderTreeItem = (item: HierarchicalItem, level = 0, isLast = false, parentPath: boolean[] = []) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)
    const currentPath = [...parentPath, isLast]

    return (
      <div key={item.id} className="relative">
        {/* Tree lines */}
        <div className="flex items-start">
          {/* Vertical connecting lines for parent levels */}
          {level > 0 && (
            <div className="flex flex-shrink-0 mr-2">
              {parentPath.map((isParentLast, index) => (
                <div key={index} className="w-6 flex justify-center">
                  {!isParentLast && index < parentPath.length && (
                    <div className="w-px bg-border h-full"></div>
                  )}
                </div>
              ))}
              
              {/* Current level connecting lines */}
              <div className="w-6 flex flex-col items-center">
                {/* Horizontal line to the item */}
                <div className="w-full h-6 flex items-center">
                  <div className={`w-full h-px bg-border ${isLast ? 'w-3' : 'w-full'}`}></div>
                </div>
                
                {/* Vertical line continuing down if not last item */}
                {!isLast && (
                  <div className="w-px bg-border flex-1 -mt-6"></div>
                )}
              </div>
            </div>
          )}

          {/* Item card */}
          <div className="flex-1">
            <Collapsible open={isExpanded} onOpenChange={() => hasChildren && toggleExpanded(item.id)}>
              <div className="group border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Folder icon and expand trigger */}
                    <div className="flex items-center gap-2">
                      {hasChildren ? (
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            className=" hover:bg-accent"
                          >
                            {isExpanded ? (
                              <FolderOpen className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Folder className="h-4 w-4 text-blue-600" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      ) : (
                        <div className="h-6 w-6 flex items-center justify-center">
                          <div className="h-2 w-2 bg-muted-foreground/50 rounded-full"></div>
                        </div>
                      )}
                      
                      {hasChildren && (
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>
                    
                    {/* Item content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{item.name}</span>
                        
                        {/* System badge */}
                        {showSystemBadge && item.is_system !== undefined && (
                          <Badge variant={item.is_system ? "default" : "secondary"} className="text-xs flex-shrink-0">
                            {item.is_system ? "Sistema" : "Personalizado"}
                          </Badge>
                        )}

                        {/* Parent/child indicators */}
                        {item.parent_id && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            Subcategoría
                          </Badge>
                        )}
                        
                        {hasChildren && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {item.children!.length} {item.children!.length === 1 ? 'hijo' : 'hijos'}
                          </Badge>
                        )}

                        {/* Custom badges */}
                        {renderItemBadges?.(item)}
                      </div>
                      
                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-muted-foreground mb-1 truncate">{item.description}</p>
                      )}
                      
                      {/* Creation date */}
                      {item.created_at && (
                        <p className="text-xs text-muted-foreground">
                          Creado: {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      )}

                      {/* Custom details */}
                      {renderItemDetails?.(item)}
                    </div>
                  </div>

                  {/* Actions menu */}
                  {(onEdit || onDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          className=" opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {onDelete && allowDelete(item) && (
                          <DropdownMenuItem 
                            onClick={() => onDelete(item)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Children */}
              {hasChildren && (
                <CollapsibleContent>
                  <div className="mt-2">
                    {item.children?.map((child, index) => 
                      renderTreeItem(
                        child, 
                        level + 1, 
                        index === item.children!.length - 1,
                        currentPath
                      )
                    )}
                  </div>
                </CollapsibleContent>
              )}
            </Collapsible>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center text-muted-foreground">
          {searchValue ? 'No se encontraron elementos que coincidan con la búsqueda' : emptyMessage}
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {items.map((item, index) => 
        renderTreeItem(item, 0, index === items.length - 1)
      )}
    </div>
  )
}