import { Card, CardContent } from '@/components/ui/card'
import { Star, Bug, Wrench, Plus as PlusIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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

export function ChangelogCard({ entry }: ChangelogCardProps) {
  return (
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
              <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                {format(new Date(entry.date), 'dd MMM', { locale: es })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}