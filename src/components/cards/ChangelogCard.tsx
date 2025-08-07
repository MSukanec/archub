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
    case 'Mejora':
    case 'Arreglo de Errores':
    default:
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
          onClick: () => onEdit?.(entry)
        },
        {
          label: "Eliminar",
          variant: "destructive" as const,
          onClick: () => onDelete?.(entry.id)
        }
      ] : []}
    >
            {/* Icon */}
              {getChangelogIcon(entry.type)}
            </div>

            {/* Content */}
                    {entry.title}
                  </h3>
                    {entry.description}
                  </p>
                </div>
                
                {/* Right side: Badge, Date */}
                    {entry.type}
                  </Badge>
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