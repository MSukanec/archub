import React from 'react'
import { FormModalLayout } from '@/components/modal'
import { FormModalHeader } from '@/components/modal'
import { FormModalFooter } from '@/components/modal'
import { FormPanel, useTaskForm } from '../forms/TaskForm'
import { Zap } from 'lucide-react'

interface TaskModalProps {
  modalData?: {
    isEditing?: boolean
    task?: any
    taskData?: any
    taskId?: string
    isDuplicating?: boolean
  } | null
  onClose: () => void
}

export function TaskModal({ modalData, onClose }: TaskModalProps) {
  const { task, isEditing = false, taskData, taskId, isDuplicating = false } = modalData || {}

  const {
    customName,
    setCustomName,
    taskDivisionId,
    setTaskDivisionId,
    unitId,
    setUnitId,
    taskDivisions,
    units,
    divisionsLoaded,
    unitsLoaded,
    isDataReady,
    isDuplicationLoading,
    handleSubmit,
    isLoading,
    canSubmit,
  } = useTaskForm({
    task,
    taskData,
    taskId,
    isEditing,
    isDuplicating,
    onSuccess: onClose,
  })

  const getTitle = () => {
    if (isDuplicating) return "Duplicar Tarea"
    if (isEditing) return "Editar Tarea"
    return "Nueva Tarea Personalizada"
  }

  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={
        <FormPanel
          taskDivisionId={taskDivisionId}
          setTaskDivisionId={setTaskDivisionId}
          unitId={unitId}
          setUnitId={setUnitId}
          customName={customName}
          setCustomName={setCustomName}
          taskDivisions={taskDivisions}
          units={units}
          divisionsLoaded={divisionsLoaded}
          unitsLoaded={unitsLoaded}
          isDataReady={isDataReady}
          isDuplicationLoading={isDuplicationLoading}
        />
      }
      headerContent={
        <FormModalHeader
          title={getTitle()}
          description={
            isDuplicating
              ? "Duplicando tarea con todos sus costos de materiales y mano de obra"
              : isEditing
              ? "Modifica los parámetros y materiales de la tarea existente"
              : "Crea una nueva tarea personalizada configurando parámetros y materiales"
          }
          icon={Zap}
        />
      }
      footerContent={
        <FormModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          rightLabel={
            isDuplicating ? "Duplicar Tarea" : isEditing ? "Actualizar Tarea" : "Crear Tarea"
          }
          onRightClick={handleSubmit}
          showLoadingSpinner={isLoading}
          submitDisabled={!canSubmit || isDuplicationLoading}
        />
      }
      onClose={onClose}
      isEditing={true}
    />
  )
}
