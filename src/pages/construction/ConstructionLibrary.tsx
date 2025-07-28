import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useTaskLibrary } from '@/hooks/use-task-library'
import { useNavigationStore } from '@/stores/navigationStore'
import { BarChart3, Search, Layers, Grid } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function ConstructionLibrary() {
  const [searchValue, setSearchValue] = useState("")
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

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.display_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.code.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.category_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.subcategory_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.rubro_name.toLowerCase().includes(searchValue.toLowerCase())
    
    const matchesCategory = !selectedCategory || task.category_name === selectedCategory
    const matchesSubcategory = !selectedSubcategory || task.subcategory_name === selectedSubcategory
    
    return matchesSearch && matchesCategory && matchesSubcategory
  })

  // Clear all filters
  const handleClearFilters = () => {
    setSearchValue("")
    setSelectedCategory("")
    setSelectedSubcategory("")
  }

  const hasActiveFilters = searchValue.trim() !== "" || selectedCategory !== "" || selectedSubcategory !== ""

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

  // Table columns configuration - similar to AdminGeneratedTasks
  const columns = [
    {
      key: 'code',
      label: 'Código',
      width: '5%',
      render: (task: any) => (
        <span className="text-xs font-mono text-muted-foreground">{task.code}</span>
      )
    },
    {
      key: 'rubro_name',
      label: 'Rubro',
      width: '10%',
      render: (task: any) => (
        <Badge variant="outline" className="text-xs">
          {task.rubro_name}
        </Badge>
      )
    },
    {
      key: 'display_name',
      label: 'Tarea',
      render: (task: any) => (
        <span className="text-sm">{task.display_name}</span>
      )
    },
    {
      key: 'unit_name',
      label: 'Unidad',
      width: '5%',
      render: (task: any) => (
        <Badge variant="secondary" className="text-xs">
          {task.unit_name || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha',
      width: '10%',
      render: (task: any) => (
        <span className="text-xs text-muted-foreground">
          {new Date(task.created_at).toLocaleDateString('es-ES')}
        </span>
      )
    }
  ]

  // Custom filters for ActionBar (similar to AdminGeneratedTasks)
  const customFilters = (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          Filtrar por categoría
        </Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las categorías</SelectItem>
            {uniqueCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          Filtrar por subcategoría
        </Label>
        <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Todas las subcategorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las subcategorías</SelectItem>
            {uniqueSubcategories.map((subcategory) => (
              <SelectItem key={subcategory} value={subcategory}>
                {subcategory}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

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
          icon={<BarChart3 className="w-6 h-6" />}
          features={features}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          customFilters={customFilters}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          showProjectSelector={false}
        />

        <Table
          data={filteredTasks}
          columns={columns}
          isLoading={tasksLoading}
        />
      </div>
    </Layout>
  )
}