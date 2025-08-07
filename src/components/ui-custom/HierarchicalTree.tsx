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
        {/* Tree lines */}
          {/* Vertical connecting lines for parent levels */}
          {level > 0 && (
              {parentPath.map((isParentLast, index) => (
                  {!isParentLast && index < parentPath.length && (
                  )}
                </div>
              ))}
              
              {/* Current level connecting lines */}
                {/* Horizontal line to the item */}
                  <div className={`w-full h-px bg-border ${isLast ? 'w-3' : 'w-full'}`}></div>
                </div>
                
                {/* Vertical line continuing down if not last item */}
                {!isLast && (
                )}
              </div>
            </div>
          )}

          {/* Item card */}
            <Collapsible open={isExpanded} onOpenChange={() => hasChildren && toggleExpanded(item.id)}>
                    {/* Folder icon and expand trigger */}
                      {hasChildren ? (
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                          >
                            {isExpanded ? (
                            ) : (
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      ) : (
                        </div>
                      )}
                      
                      {hasChildren && (
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                          >
                            {isExpanded ? (
                            ) : (
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>
                    
                    {/* Item content */}
                        
                        {/* System badge */}
                        {showSystemBadge && item.is_system !== undefined && (
                            {item.is_system ? "Sistema" : "Personalizado"}
                          </Badge>
                        )}

                        {/* Parent/child indicators */}
                        {item.parent_id && (
                            Subcategoría
                          </Badge>
                        )}
                        
                        {hasChildren && (
                            {item.children!.length} {item.children!.length === 1 ? 'hijo' : 'hijos'}
                          </Badge>
                        )}

                        {/* Custom badges */}
                        {renderItemBadges?.(item)}
                      </div>
                      
                      {/* Description */}
                      {item.description && (
                      )}
                      
                      {/* Creation date */}
                      {item.created_at && (
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
                          size="sm" 
                        >
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            Editar
                          </DropdownMenuItem>
                        )}
                        {onDelete && allowDelete(item) && (
                          <DropdownMenuItem 
                            onClick={() => onDelete(item)}
                          >
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
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Card className={`p-8 ${className}`}>
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