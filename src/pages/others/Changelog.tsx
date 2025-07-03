import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { Plus, History, Search, Filter, X } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useChangelogEntries } from '@/hooks/use-changelog'
import { NewChangelogEntryModal } from '@/modals/others/NewChangelogEntryModal'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
import { ChangelogCard } from '@/components/cards/ChangelogCard'
import { useMobileActionBar } from '@/contexts/MobileActionBarContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Icon mapping for changelog types


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
  }) as [string, any[]][]
}

export default function Changelog() {
  const [searchValue, setSearchValue] = useState("")
  const [showNewEntryModal, setShowNewEntryModal] = useState(false)
  const { data: userData } = useCurrentUser()
  const { data: entries, isLoading } = useChangelogEntries()
  const { setActions, setShowActionBar, clearActions } = useMobileActionBar()

  // Configure mobile action bar
  useEffect(() => {
    console.log('User data:', userData)
    console.log('User role:', userData?.role?.name)
    const isAdmin = userData?.role?.name === "super_admin"
    console.log('Is admin:', isAdmin)
    
    setActions({
      slot2: {
        id: 'search',
        icon: <Search className="h-4 w-4" />,
        label: 'Buscar',
        onClick: () => {
          // Focus search in header if available
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
          if (searchInput) {
            searchInput.focus()
          }
        }
      },
      ...(isAdmin && {
        slot3: {
          id: 'create',
          icon: <Plus className="h-4 w-4" />,
          label: 'Crear',
          onClick: () => setShowNewEntryModal(true),
          variant: 'primary' as const
        }
      }),
      slot4: {
        id: 'filter',
        icon: <Filter className="h-4 w-4" />,
        label: 'Filtrar',
        onClick: () => {
          // Future: implement filter functionality
        }
      },
      slot5: {
        id: 'clear',
        icon: <X className="h-4 w-4" />,
        label: 'Limpiar',
        onClick: () => setSearchValue("")
      }
    })
    setShowActionBar(true)

    return () => {
      clearActions()
    }
  }, [userData?.role?.name, setActions, setShowActionBar, clearActions])

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
    actions: [
      <Button 
        key="new-entry"
        className="h-8 px-3 text-sm"
        onClick={() => setShowNewEntryModal(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nueva Entrada
      </Button>
    ]
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
                <ChangelogCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New Entry Modal */}
      {showNewEntryModal && (
        <NewChangelogEntryModal
          onClose={() => setShowNewEntryModal(false)}
        />
      )}
    </Layout>
  )
}