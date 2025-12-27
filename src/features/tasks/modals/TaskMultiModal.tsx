import React from 'react';
import { useModalPanelStore } from "@/components/modal";
import { FormModalLayout, FormModalHeader, FormModalFooter } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Layers, Wrench, CheckSquare } from "lucide-react";
import { useCurrentUser } from "@/features/users/hooks";

import {
  FormPanel,
  useTaskMultiModalForm,
  ParameterSelection,
} from '../forms/TaskMultiModalForm';
import { ParametricTaskBuilder } from "@/features/tasks";
import { Label } from "@/components/ui/label";
import { ComboBox } from "@/components/shared/fields/ComboBoxWriteField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TaskMultiModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
    editingTask?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function TaskMultiModal({
  modalData,
  onClose
}: TaskMultiModalProps) {
  const { currentPanel, setPanel, currentSubform, setCurrentSubform } = useModalPanelStore();

  const hookData = useTaskMultiModalForm(modalData, onClose, setPanel as any, setCurrentSubform as any);

  const {
    form,
    handleSubmit,
    onSubmit,
    errors,
    selectedTasks,
    searchQuery,
    rubroFilter,
    filteredTasks,
    tasks,
    projectPhases,
    rubros,
    units,
    
    setSearchQuery,
    setRubroFilter,
    setSelectedTasks,
    handleTaskSelection,
    
    showParametricTaskCreator,
    activeTab,
    taskNameText,
    selectedCategoryId,
    selectedUnitId,
    
    setActiveTab,
    setTaskNameText,
    setSelectedCategoryId,
    setSelectedUnitId,
    
    parametricSelections,
    parametricTaskPreview,
    parametricParameterOrder,
    
    setParametricSelections,
    setParametricTaskPreview,
    setParametricParameterOrder,
    
    handleCreateParametricTask,
    handleCreateCustomTask,
    
    parametricTaskBuilderRef,
    
    isCreatingParametricTask,
    isCreatingCustomTask,
    isSubmitting,
    tasksLoading,
    rubrosLoading,
    unitsLoading,
  } = hookData;

  const viewPanel = (
    <div className="p-4 text-center text-muted-foreground">
      Este modal no tiene vista previa
    </div>
  );

  const editPanel = (
    <FormPanel
      selectedTasks={selectedTasks}
      searchQuery={searchQuery}
      rubroFilter={rubroFilter}
      filteredTasks={filteredTasks}
      tasks={tasks}
      projectPhases={projectPhases}
      rubros={rubros}
      units={units}
      
      setSearchQuery={setSearchQuery}
      setRubroFilter={setRubroFilter}
      setSelectedTasks={setSelectedTasks}
      handleTaskSelection={handleTaskSelection}
      
      form={form}
      errors={errors}
      
      setPanel={setPanel}
      setCurrentSubform={setCurrentSubform}
      
      showParametricTaskCreator={showParametricTaskCreator}
      activeTab={activeTab}
      taskNameText={taskNameText}
      selectedCategoryId={selectedCategoryId}
      selectedUnitId={selectedUnitId}
      
      setActiveTab={setActiveTab}
      setTaskNameText={setTaskNameText}
      setSelectedCategoryId={setSelectedCategoryId}
      setSelectedUnitId={setSelectedUnitId}
      
      parametricSelections={parametricSelections}
      parametricTaskPreview={parametricTaskPreview}
      parametricParameterOrder={parametricParameterOrder}
      
      setParametricSelections={setParametricSelections}
      setParametricTaskPreview={setParametricTaskPreview}
      setParametricParameterOrder={setParametricParameterOrder}
      
      handleCreateParametricTask={handleCreateParametricTask}
      handleCreateCustomTask={handleCreateCustomTask}
      
      parametricTaskBuilderRef={parametricTaskBuilderRef}
      
      isCreatingParametricTask={isCreatingParametricTask}
      isCreatingCustomTask={isCreatingCustomTask}
      tasksLoading={tasksLoading}
      rubrosLoading={rubrosLoading}
      unitsLoading={unitsLoading}
    />
  );

  const getSubform = () => {
    switch (currentSubform) {
      case 'parametric-task':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-6">
              <div className="px-6 pt-0 pb-0">
                <div 
                  className="flex items-center rounded-lg p-1 gap-0.5 bg-[var(--button-ghost-bg)] border border-[var(--card-border)] shadow-button-normal w-full"
                >
                  <button
                    onClick={() => setActiveTab('parametric')}
                    className={`flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 px-3 py-1.5 h-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${
                      activeTab === 'parametric'
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm rounded-lg"
                        : "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)] rounded-md"
                    }`}
                  >
                    Nueva Tarea Paramétrica
                  </button>
                  <button
                    onClick={() => setActiveTab('custom')}
                    className={`flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 px-3 py-1.5 h-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${
                      activeTab === 'custom'
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm rounded-lg"
                        : "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)] rounded-md"
                    }`}
                  >
                    Nueva Tarea Personalizada
                  </button>
                </div>
              </div>
              
              {activeTab === 'parametric' && (
                <div>
                  <div className="mb-4 px-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
                        <Layers className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Tarea Paramétrica de la Comunidad</h3>
                        <p className="text-xs text-muted-foreground">Esta tarea se generará mediante parámetros configurables y formará parte de la librería de tareas disponible para toda la comunidad de usuarios.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <ParametricTaskBuilder
                      ref={parametricTaskBuilderRef}
                      onSelectionChange={setParametricSelections}
                      onPreviewChange={setParametricTaskPreview}
                      onOrderChange={setParametricParameterOrder}
                      onCreateTask={handleCreateParametricTask}
                      initialParameters={null}
                      initialParameterOrder={null}
                    />
                  </div>
                </div>
              )}
                
              {activeTab === 'custom' && (
                <div>
                  <div className="mb-4 px-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
                        <Wrench className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Tarea Completamente Personalizada</h3>
                        <p className="text-xs text-muted-foreground">Esta tarea será completamente personalizada y única para tu proyecto. Solo estará disponible para ti y no se compartirá con otros usuarios.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6 px-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-foreground">
                          Rubro *
                        </Label>
                        <ComboBox
                          placeholder="Selecciona un rubro..."
                          options={rubros.map(rubro => ({
                            value: rubro.id,
                            label: rubro.name
                          }))}
                          value={selectedCategoryId}
                          onValueChange={setSelectedCategoryId}
                          disabled={rubrosLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-foreground">
                          Unidad *
                        </Label>
                        <Select value={selectedUnitId} onValueChange={setSelectedUnitId} disabled={unitsLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una unidad..." />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit: any) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name} ({unit.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground">
                        Nombre de la Tarea *
                      </Label>
                      <Textarea
                        placeholder="Describe detalladamente la tarea a realizar..."
                        value={taskNameText}
                        onChange={(e) => setTaskNameText(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const headerContent = currentPanel === 'subform' ? (
    <FormModalHeader
      title="Crear Nueva Tarea Personalizada"
      description="Elige el método para crear tu nueva tarea de construcción"
      icon={Plus}
      leftActions={
        <Button
          variant="ghost"
          onClick={() => setPanel('edit')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      }
    />
  ) : (
    <FormModalHeader 
      title={modalData.isEditing ? "Editar Tarea de Construcción" : "Seleccionar Tareas del Proyecto"}
      icon={CheckSquare}
    />
  );

  const footerContent = currentPanel === 'subform' ? (
    activeTab === 'parametric' ? (
      <FormModalFooter
        leftLabel="Cancelar"
        onLeftClick={() => setPanel('edit')}
        rightLabel="Crear Nueva Tarea"
        onRightClick={() => {
          if (parametricTaskBuilderRef.current?.executeCreateTaskCallback) {
            parametricTaskBuilderRef.current.executeCreateTaskCallback();
          } else {
            const taskData = {
              selections: parametricSelections,
              preview: parametricTaskPreview,
              paramValues: (() => {
                const values: Record<string, string> = {};
                parametricSelections.forEach(sel => {
                  values[sel.parameterSlug] = sel.optionId;
                });
                return values;
              })(),
              paramOrder: parametricParameterOrder,
              availableParameters: []
            };
            handleCreateParametricTask(taskData);
          }
        }}
        showLoadingSpinner={isCreatingParametricTask}
        submitDisabled={parametricSelections.length === 0 || isCreatingParametricTask}
      />
    ) : (
      <FormModalFooter
        leftLabel="Cancelar"
        onLeftClick={() => {
          setTaskNameText('');  
          setSelectedCategoryId('');
          setSelectedUnitId('');
          setPanel('edit');
          setActiveTab('parametric');
        }}
        rightLabel={isCreatingCustomTask ? "Creando..." : "Crear Nueva Tarea"}
        onRightClick={handleCreateCustomTask}
        showLoadingSpinner={isCreatingCustomTask}
        submitDisabled={!taskNameText.trim() || !selectedCategoryId || !selectedUnitId || isCreatingCustomTask}
      />
    )
  ) : (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={modalData.isEditing ? "Guardar Cambios" : `Agregar ${selectedTasks.length} Tarea${selectedTasks.length !== 1 ? 's' : ''}`}
      onRightClick={() => {
        console.log('🎯 BOTÓN PRESIONADO - Form errors:', form.formState.errors);
        console.log('🎯 BOTÓN PRESIONADO - Form isValid:', form.formState.isValid);
        console.log('🎯 BOTÓN PRESIONADO - Form values:', form.getValues());
        console.log('🎯 BOTÓN PRESIONADO - selectedTasks:', selectedTasks);
        handleSubmit(onSubmit)();
      }}
      showLoadingSpinner={isSubmitting}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      wide={true}
      viewPanel={viewPanel}
      editPanel={editPanel}
      subformPanel={getSubform()}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  );
}
