import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Plus, Star, Bug, Wrench, Plus as PlusIcon, History } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useChangelogEntries } from '@/hooks/use-changelog'
// import { NewChangelogEntryModal } from '@/modals/others/NewChangelogEntryModal'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Icon mapping for changelog types
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

// Group entries by date
const groupEntriesByDate = (entries: any[]): [string, any[]][] => {
  const grouped = entries.reduce((acc, entry) => {
    const date = format(new Date(entry.date), 'dd \'de\' MMMM', { locale: es })
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(entry)
    return acc
  }, {} as Record<string, any[]>)
  
  return Object.entries(grouped).sort(([a], [b]) => {
    // Sort by date descending (newest first)  
    const dateA = new Date(grouped[a][0]?.date || a)
    const dateB = new Date(grouped[b][0]?.date || b)
    return dateB.getTime() - dateA.getTime()
  })
}

export default function Changelog() {
  const [searchValue, setSearchValue] = useState("")
  // const [showNewEntryModal, setShowNewEntryModal] = useState(false)
  const { data: userData } = useCurrentUser()
  const { data: entries, isLoading } = useChangelogEntries()

  // Filter entries based on search
  const filteredEntries = entries?.filter((entry: any) =>
    entry.title.toLowerCase().includes(searchValue.toLowerCase()) ||
    entry.description.toLowerCase().includes(searchValue.toLowerCase())
  ) || []

  const groupedEntries = groupEntriesByDate(filteredEntries)

  const headerProps = {
    title: "Changelog",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: false,
    onClearFilters: () => setSearchValue(""),
    actions: []
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Cargando changelog...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <Layout headerProps={headerProps}>
        <CustomEmptyState
          icon={History as any}
          title="No hay entradas en el changelog"
          description="Aquí aparecerán las novedades y cambios de la plataforma"
        />
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {groupedEntries.map(([date, dateEntries]) => (
          <div key={date} className="space-y-3">
            {/* Date Header */}
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold capitalize">{date}</h2>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Entries for this date */}
            <div className="space-y-3">
              {dateEntries.map((entry: any) => (
                <Card key={entry.id} className="overflow-hidden">
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
                          
                          {/* Type Badge and Date */}
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <Badge variant="secondary" className="text-xs">
                              {entry.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.date), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>


    </Layout>
  )
}