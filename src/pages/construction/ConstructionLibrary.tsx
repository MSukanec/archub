import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { BudgetTable } from '@/components/ui-custom/BudgetTable'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useTaskLibrary } from '@/hooks/use-task-library'
import { useNavigationStore } from '@/stores/navigationStore'
import { BarChart3, Search, Layers, FileText, Tag, Grid, Filter, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export default function ConstructionLibrary() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState("category")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  
  const { data: userData, isLoading } = useCurrentUser()
  const { data: tasks = [], isLoading: tasksLoading } = useTaskLibrary(
    userData?.organization?.id || ''
  )
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [setSidebarContext])

  // Get unique categories and subcategories for filters
  const uniqueCategories = Array.from(new Set(tasks.map(t => t.category_name))).sort()
  const uniqueSubcategories = Array.from(new Set(tasks.map(t => t.subcategory_name))).sort()

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch = task.display_name.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.code.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.category_name.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.subcategory_name.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.rubro_name.toLowerCase().includes(searchValue.toLowerCase())
      
      const matchesCategory = !selectedCategory || task.category_name === selectedCategory
      const matchesSubcategory = !selectedSubcategory || task.subcategory_name === selectedSubcategory
      
      return matchesSearch && matchesCategory && matchesSubcategory
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.display_name.localeCompare(b.display_name)
      if (sortBy === 'category') return a.category_name.localeCompare(b.category_name)
      if (sortBy === 'subcategory') return a.subcategory_name.localeCompare(b.subcategory_name)
      if (sortBy === 'rubro') return a.rubro_name.localeCompare(b.rubro_name)
      if (sortBy === 'code') return a.code.localeCompare(b.code)
      return a.category_name.localeCompare(b.category_name)
    })

  // Clear all filters
  const handleClearFilters = () => {
    setSearchValue("")
    setSortBy("category")
    setSelectedCategory("")
    setSelectedSubcategory("")
  }

  const hasActiveFilters = searchValue.trim() !== "" || selectedCategory !== "" || selectedSubcategory !== ""

  // Custom filters for ActionBar
  const customFilters = (
    <div className="w-[288px] space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Filtrar por categoría</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las categorías</SelectItem>
            {uniqueCategories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Filtrar por subcategoría</Label>
        <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
          <SelectTrigger>
            <SelectValue placeholder="Todas las subcategorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las subcategorías</SelectItem>
            {uniqueSubcategories.map(subcategory => (
              <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">Categoría</SelectItem>
            <SelectItem value="subcategory">Subcategoría</SelectItem>
            <SelectItem value="rubro">Rubro</SelectItem>
            <SelectItem value="name">Nombre de tarea</SelectItem>
            <SelectItem value="code">Código</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const features = [
    {
      icon: <BarChart3 className="w-4 h-4" />,
      title: "Análisis de Costos por Categoría",
      description: "Visualiza y compara los costos de tareas organizadas por categorías y subcategorías específicas."
    },
    {
      icon: <Search className="w-4 h-4" />,
      title: "Búsqueda Avanzada de Tareas",
      description: "Encuentra rápidamente tareas específicas usando códigos, nombres, rubros o categorías."
    },
    {
      icon: <Layers className="w-4 h-4" />,
      title: "Filtrado por Rubros",
      description: "Organiza y filtra las tareas por diferentes rubros de construcción para mejor análisis."
    },
    {
      icon: <Grid className="w-4 h-4" />,
      title: "Vista Comparativa de Costos",
      description: "Compara costos unitarios y cantidades entre diferentes tareas del mismo tipo."
    }
  ]

  const headerProps = {
    title: "Análisis de Costos"
  }

  // Table columns configuration
  const columns = [
    {
      key: 'category_name',
      label: 'Categoría',
      width: '15%',
      render: (task: any) => (
        <div className="space-y-1">
          <Badge variant="outline" className="text-xs">
            {task.category_name}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {task.category_code}
          </div>
        </div>
      )
    },
    {
      key: 'subcategory_name',
      label: 'Subcategoría',
      width: '15%',
      render: (task: any) => (
        <div className="space-y-1">
          <Badge variant="secondary" className="text-xs">
            {task.subcategory_name}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {task.subcategory_code}
          </div>
        </div>
      )
    },
    {
      key: 'rubro_name',
      label: 'Rubro',
      width: '15%',
      render: (task: any) => (
        <div className="space-y-1">
          <span className="text-sm font-medium">{task.rubro_name}</span>
          <div className="text-xs text-muted-foreground">
            {task.rubro_code}
          </div>
        </div>
      )
    },
    {
      key: 'display_name',
      label: 'Nombre de Tarea',
      width: '40%',
      render: (task: any) => (
        <div className="space-y-1">
          <span className="text-sm font-medium line-clamp-2">{task.display_name}</span>
          <div className="text-xs text-muted-foreground font-mono">
            {task.code}
          </div>
        </div>
      )
    },
    {
      key: 'task_group_name',
      label: 'Grupo de Tareas',
      width: '15%',
      render: (task: any) => (
        <span className="text-sm text-muted-foreground">{task.task_group_name}</span>
      )
    }
  ]

  if (isLoading || tasksLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando análisis de costos...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        <ActionBarDesktop
          title="Análisis de Costos"
          icon={BarChart3}
          features={features}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          customFilters={customFilters}
          onClearFilters={handleClearFilters}
        />
        
        <FeatureIntroduction
          title="Análisis de Costos"
          description="Analiza y compara los costos de todas las tareas de construcción disponibles en tu organización."
          features={features}
        />

        {filteredTasks.length === 0 && !tasksLoading ? (
          <EmptyState
            icon={<BarChart3 className="w-8 h-8 text-muted-foreground" />}
            title="No hay datos para análisis"
            description="Los datos de análisis de costos aparecerán aquí cuando se agreguen tareas al sistema"
          />
        ) : (
          <>
            {/* Action Bar Desktop - Only visible when data exists */}
            <ActionBarDesktop
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              showGrouping={false}
              customActions={[
                <Popover key="category-filter">
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      style={{
                        backgroundColor: selectedCategory ? 'var(--accent)' : undefined,
                        color: selectedCategory ? 'var(--accent-foreground)' : undefined
                      }}
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    align="start" 
                    className="w-56 p-0 rounded-lg shadow-button-normal border"
                    style={{ 
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)'
                    }}
                  >
                    <div className="py-1">
                      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--card-border)' }}>
                        <span className="text-xs font-medium text-muted-foreground">CATEGORÍAS</span>
                      </div>
                      <button
                        onClick={() => setSelectedCategory('')}
                        className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] ${!selectedCategory ? 'bg-[var(--button-ghost-hover-bg)]' : ''}`}
                      >
                        Todas las categorías
                      </button>
                      {uniqueCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] ${selectedCategory === category ? 'bg-[var(--button-ghost-hover-bg)]' : ''}`}
                        >
                          {category}
                        </button>
                      ))}
                      
                      <div className="px-3 py-2 border-b border-t mt-1" style={{ borderColor: 'var(--card-border)' }}>
                        <span className="text-xs font-medium text-muted-foreground">SUBCATEGORÍAS</span>
                      </div>
                      <button
                        onClick={() => setSelectedSubcategory('')}
                        className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] ${!selectedSubcategory ? 'bg-[var(--button-ghost-hover-bg)]' : ''}`}
                      >
                        Todas las subcategorías
                      </button>
                      {uniqueSubcategories.map((subcategory) => (
                        <button
                          key={subcategory}
                          onClick={() => setSelectedSubcategory(subcategory)}
                          className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] ${selectedSubcategory === subcategory ? 'bg-[var(--button-ghost-hover-bg)]' : ''}`}
                        >
                          {subcategory}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>,
                <Button
                  key="clear-filters"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters}
                >
                  <X className="w-4 h-4" />
                </Button>
              ]}
            />
            
            <BudgetTable
              tasks={filteredTasks}
              columns={columns}
              isLoading={tasksLoading}
              showGrouping={true}
              groupBy="category_name"
              emptyState={
                <EmptyState
                  icon={<BarChart3 className="w-8 h-8 text-muted-foreground" />}
                  title="No se encontraron tareas"
                  description="No hay tareas que coincidan con los filtros aplicados"
                />
              }
            />
          </>
        )}
      </div>
    </Layout>
  )
}