  return (
    <Layout wide={true} headerProps={headerProps}>
      <div className="space-y-6">
        {/* Feature Introduction */}
        <FeatureIntroduction
          title="Gestión de Presupuestos"
          icon={<Calculator className="w-6 h-6" />}
          features={[
            {
              icon: <CheckSquare className="w-4 h-4" />,
              title: "Presupuestos Detallados",
              description: "Crea y gestiona presupuestos con tareas específicas, cantidades y costos detallados por proyecto."
            },
            {
              icon: <Filter className="w-4 h-4" />,
              title: "Organización por Rubros",
              description: "Agrupa tareas por categorías para una mejor visualización y análisis de costos por área."
            },
            {
              icon: <Target className="w-4 h-4" />,
              title: "Búsqueda Inteligente",
              description: "Encuentra rápidamente tareas del catálogo o crea nuevas tareas personalizadas para tu presupuesto."
            },
            {
              icon: <BarChart3 className="w-4 h-4" />,
              title: "Control de Costos",
              description: "Monitorea el progreso y los totales de tu presupuesto en tiempo real con actualizaciones automáticas."
            }
          ]}
        />

        {filteredBudgets.length === 0 ? (
          <EmptyState
            icon={<Calculator className="w-12 h-12 text-muted-foreground" />}
            title={searchValue ? "No se encontraron presupuestos" : "No hay presupuestos creados"}
            description={searchValue 
              ? 'Prueba ajustando los filtros de búsqueda' 
              : 'Comienza creando tu primer presupuesto para gestionar los costos del proyecto'
            }
            action={
              !searchValue && (
                <Button onClick={() => openModal('budget', {})}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Presupuesto
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Action Bar Desktop - Only visible when data exists */}
            <ActionBarDesktop
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              showGrouping={selectedBudget ? true : false}
              groupingType={groupingType}
              onGroupingChange={setGroupingType}
              primaryActionLabel={selectedBudget ? "Nueva Tarea" : "Nuevo Presupuesto"}
              onPrimaryActionClick={selectedBudget ? () => openModal('budget-task-bulk-add', { 
                budgetId: selectedBudget.id,
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: ['budget-tasks', selectedBudget.id] });
                }
              }) : () => openModal('budget', {})}
              customActions={selectedBudget ? [
                <Button 
                  key="nuevo-presupuesto"
                  variant="secondary" 
                  onClick={() => openModal('budget', {})}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Presupuesto
                </Button>
              ] : []}
              budgetSelector={{
                budgets: filteredBudgets,
                selectedBudgetId,
                onBudgetChange: handleBudgetChange,
                onEditBudget: handleEditBudget,
                onDeleteBudget: handleDeleteSelectedBudget
              }}
            />

            {/* Budget Tasks Table - Direct without Card wrapper */}
            {selectedBudget ? (
              <BudgetTaskTableWithSelector 
                budgetId={selectedBudget.id} 
                groupingType={groupingType}
                onGroupingChange={setGroupingType}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Selecciona un presupuesto para ver sus tareas
              </div>
            )}
          </>
        )}
      </div>




    </Layout>
  );
}