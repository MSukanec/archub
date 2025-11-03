import { useState, useMemo } from 'react'
import { useLocation } from 'wouter'
import { ComboBox as ComboBoxWriteField } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { useMaterials, Material, useDeleteMaterial } from '@/hooks/use-materials'
import { Package, Eye, Edit, Copy, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useCurrentUser } from '@/hooks/use-current-user'
import { cn } from '@/lib/utils'

export default function MaterialList() {
  const [groupingType, setGroupingType] = useState('category')
  const [filterByCategory, setFilterByCategory] = useState("all")
  const [filterByMaterialType, setFilterByMaterialType] = useState("all")
  
  const { data: materials = [], isLoading: materialsLoading } = useMaterials()
  const deleteMaterialMutation = useDeleteMaterial()
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const [, navigate] = useLocation()

  // Filter materials and add groupKey for grouping
  const filteredMaterials = useMemo(() => {
    let filtered = materials.filter(material => {
      // Filtro por categoría
      if (filterByCategory !== "all") {
        if ((material.category_name || 'Sin categoría') !== filterByCategory) {
          return false;
        }
      }

      // Filtro por tipo de material
      if (filterByMaterialType !== "all") {
        if ((material.material_type || 'Sin tipo') !== filterByMaterialType) {
          return false;
        }
      }

      return true;
    });

    const materialsWithGroupKey = filtered.map(material => {
      let groupKey = '';
      
      switch (groupingType) {
        case 'category':
          groupKey = material.category_name || 'Sin categoría';
          break;
        case 'material_type':
          groupKey = material.material_type || 'Sin tipo';
          break;
        default:
          groupKey = '';
      }
      
      return {
        ...material,
        groupKey
      };
    });

    // Ordenar según el tipo de agrupación
    return materialsWithGroupKey.sort((a, b) => {
      switch (groupingType) {
        case 'category':
          const categoryA = a.category_name || 'Sin categoría';
          const categoryB = b.category_name || 'Sin categoría';
          return categoryA.localeCompare(categoryB);
        case 'material_type':
          const typeA = a.material_type || 'Sin tipo';
          const typeB = b.material_type || 'Sin tipo';
          return typeA.localeCompare(typeB);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [materials, groupingType, filterByCategory, filterByMaterialType]);

  const handleView = (materialId: string) => {
    navigate(`/analysis/materials/${materialId}`)
  }

  const handleEdit = (material: Material) => {
    openModal('material-form', {
      editingMaterial: material,
      isDuplicating: false
    })
  }

  const handleDuplicate = (material: Material) => {
    openModal('material-form', {
      editingMaterial: material,
      isDuplicating: true
    })
  }

  const handleDelete = (material: Material) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Material',
      description: `¿Estás seguro que deseas eliminar el material "${material.name}"? Esta acción no se puede deshacer.`,
      itemName: material.name,
      destructiveActionText: 'Eliminar Material',
      onDelete: () => deleteMaterialMutation.mutate(material.id),
      isLoading: deleteMaterialMutation.isPending
    })
  }

  // Get unique options for filters
  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    materials.forEach(material => {
      categories.add(material.category_name || 'Sin categoría');
    });
    return Array.from(categories).sort();
  }, [materials]);

  const materialTypeOptions = useMemo(() => {
    const types = new Set<string>();
    materials.forEach(material => {
      types.add(material.material_type || 'Sin tipo');
    });
    return Array.from(types).sort();
  }, [materials]);

  // Clear filters function
  const handleClearFilters = () => {
    setFilterByCategory("all");
    setFilterByMaterialType("all");
  };

  // Check if any filters are active
  const isFilterActive = filterByCategory !== "all" || filterByMaterialType !== "all";

  // Filter content component
  const renderFilterContent = () => (
    <>
      <div>
        <label className="text-xs font-medium mb-2 block">Categoría</label>
        <ComboBoxWriteField
          value={filterByCategory}
          onValueChange={setFilterByCategory}
          options={[
            { value: "all", label: "Todas las categorías" },
            ...categoryOptions.map(category => ({ value: category, label: category }))
          ]}
          placeholder="Todas las categorías"
          className="w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium mb-2 block">Tipo</label>
        <ComboBoxWriteField
          value={filterByMaterialType}
          onValueChange={setFilterByMaterialType}
          options={[
            { value: "all", label: "Todos los tipos" },
            ...materialTypeOptions.map(type => ({ value: type, label: type }))
          ]}
          placeholder="Todos los tipos"
          className="w-full"
        />
      </div>
    </>
  );

  // Base columns definition
  const baseColumns = [
    {
      key: 'is_system',
      label: 'Tipo',
      width: '11%',
      render: (material: Material) => (
        <Badge 
          variant={material.is_system ? "default" : "secondary"}
          className={`text-xs ${material.is_system 
            ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90' 
            : 'bg-[var(--accent-2)] text-white hover:bg-[var(--accent-2)]/90'
          }`}
        >
          {material.is_system ? 'Sistema' : 'Organización'}
        </Badge>
      )
    },
    {
      key: 'category',
      label: 'Categoría',
      width: '20%',
      render: (material: Material) => (
        <span className="text-sm font-medium">
          {material.category_name || 'Sin categoría'}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Nombre',
      width: '25%',
      render: (material: Material) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {material.name}
          </span>
          {material.material_type && (
            <span className="text-xs text-muted-foreground">
              {material.material_type}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'unit',
      label: 'Unidad',
      width: '12%',
      render: (material: Material) => (
        <Badge variant="secondary" className="text-xs">
          {material.unit_of_computation || material.unit_description || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'avg_price',
      label: 'Precio Promedio',
      width: '16%',
      render: (material: Material) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-mono">
            {material.avg_price !== null && material.avg_price !== undefined ? 
              `ARS ${material.avg_price.toFixed(2)}` : 
              '-'
            }
          </span>
          {material.product_count && material.product_count > 0 && (
            <span className="text-xs text-muted-foreground">
              {material.product_count} producto{material.product_count > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )
    }
  ]
  
  // Render grouping popover content
  const renderGroupingContent = () => {
    const groupingOptions = [
      { value: 'none', label: 'No Agrupar' },
      { value: 'category', label: 'Agrupar por Categoría' },
      { value: 'material_type', label: 'Agrupar por Tipo' }
    ];

    return (
      <>
        <div className="text-xs font-medium mb-2 block">Agrupar por</div>
        <div className="space-y-1">
          {groupingOptions.map((option) => (
            <Button
              key={option.value}
              variant={groupingType === option.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setGroupingType(option.value as 'none' | 'category' | 'material_type')}
              className={cn(
                "w-full justify-start text-xs font-normal h-8",
                groupingType === option.value ? "button-secondary-pressed hover:bg-secondary" : ""
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </>
    );
  };

  // Select columns based on grouping type
  const materialsColumns = useMemo(() => {
    // For no grouping, use all base columns
    if (groupingType === 'none') {
      return baseColumns;
    }
    
    // Filter columns for grouping - hide the grouped column
    return baseColumns.filter(column => {
      if (groupingType === 'category' && column.key === 'category') return false;
      if (groupingType === 'material_type' && column.key === 'material_type') return false;
      return true;
    });
  }, [groupingType]);

  return (
    <div className="space-y-6">
      {/* Materials Table */}
      <div className="w-full">
        {materialsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)]" />
          </div>
        ) : materials.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title="No hay materiales registrados"
            description="Comienza agregando materiales al catálogo desde el panel de administración."
          />
        ) : (
          <Table
            data={filteredMaterials}
            columns={materialsColumns}
            groupBy={groupingType === 'none' ? undefined : 'groupKey'}
            rowActions={(material) => {
              const actions = [
                {
                  icon: Eye,
                  label: 'Ver Detalle',
                  onClick: () => handleView(material.id)
                }
              ];
              if (!material.is_system) {
                actions.push(
                  {
                    icon: Edit,
                    label: 'Editar',
                    onClick: () => handleEdit(material)
                  },
                  {
                    icon: Copy,
                    label: 'Duplicar',
                    onClick: () => handleDuplicate(material)
                  },
                  {
                    icon: Trash2,
                    label: 'Eliminar',
                    onClick: () => handleDelete(material),
                    variant: 'destructive' as const
                  }
                );
              }
              return actions;
            }}
            topBar={{
              renderFilterContent: renderFilterContent,
              isFilterActive: isFilterActive,
              renderGroupingContent: renderGroupingContent,
              isGroupingActive: groupingType !== 'none',
              onClearFilters: handleClearFilters
            }}
            renderGroupHeader={groupingType === 'none' ? undefined : (groupKey: string, groupRows: any[]) => {
              return (
                <>
                  <div className="col-span-full text-sm font-medium">
                    {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Material' : 'Materiales'})
                  </div>
                </>
              );
            }}
            emptyState={
              <EmptyState
                icon={<Package />}
                title="No se encontraron materiales"
                description="Intenta ajustar los filtros de búsqueda."
              />
            }
            className="bg-[var(--card-bg)] border-[var(--card-border)]"
          />
        )}
      </div>
    </div>
  )
}
