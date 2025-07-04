import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, Bug, Wrench, Plus as PlusIcon, Edit, Trash2 } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import SwipeableCard from '@/components/layout/mobile/SwipeableCard'

interface ChangelogEntry {
  id: string
  title: string
  description: string
  type: 'Novedad' | 'Mejora' | 'Arreglo de Errores'
  date: string
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

interface ChangelogCardProps {
  entry: ChangelogEntry
  onEdit?: (entry: ChangelogEntry) => void
  onDelete?: (entryId: string) => void
}

const getChangelogIcon = (type: string) => {
  switch (type) {
    case 'Novedad':
      return <Star className="h-4 w-4 text-blue-500" />
    case 'Mejora':
      return <Wrench className="h-4 w-4 text-green-500" />
    case 'Arreglo de Errores':
      return <Bug className="h-4 w-4 text-red-500" />
    default:
      return <PlusIcon className="h-4 w-4 text-purple-500" />
  }
}

export function ChangelogCard({ entry, onEdit, onDelete }: ChangelogCardProps) {
  const { data: userData } = useCurrentUser()
  const isAdmin = userData?.role?.name === "super_admin"

  return (
    <SwipeableCard
      actions={isAdmin ? [
        {
          label: "Editar",
          icon: <Edit className="w-4 h-4" />,
          onClick: () => onEdit?.(entry)
        },
        {
          label: "Eliminar",
          icon: <Trash2 className="w-4 h-4" />,
          variant: "destructive" as const,
          onClick: () => onDelete?.(entry.id)
        }
      ] : []}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="mt-0.5">
              {getChangelogIcon(entry.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-sm leading-5 mb-1">
                    {entry.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-5 line-clamp-2">
                    {entry.description}
                  </p>
                </div>
                
                {/* Right side: Badge, Date */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    {entry.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.date), 'dd MMM', { locale: es })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SwipeableCard>
  )
}