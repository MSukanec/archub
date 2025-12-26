/**
 * Enterprise Autosave System
 * 
 * Centralized autosave architecture for Seencel.
 * Provides Notion/Linear-style autosave behavior:
 * 
 * RULES:
 * 1. NEVER save on onChange - only updates local draft
 * 2. Save triggers: onBlur, Enter key, select/toggle change
 * 3. All data normalized before save (''→ null, trim strings)
 * 4. Dirty checking to avoid unnecessary saves
 * 
 * USAGE:
 * 
 * // Controller manages the save orchestration
 * const saveController = useAutosaveController({
 *   queryKey: projectsKeys.data(projectId),
 *   saveFn: async (data) => { ... },
 *   additionalQueryKeys: [projectsKeys.list(orgId)],
 * });
 * 
 * // Individual fields use useAutosaveField
 * const nameField = useAutosaveField({
 *   initialValue: projectData?.name || '',
 *   onSave: (value) => saveController.save({ ...currentData, name: value }),
 *   type: 'text',
 * });
 * 
 * // In JSX:
 * <Input
 *   value={nameField.value}
 *   onChange={nameField.onChange}
 *   onBlur={nameField.onBlur}
 *   onKeyDown={nameField.onKeyDown}
 * />
 */
export { useAutosaveController } from './useAutosaveController';
export type { AutosaveControllerOptions, AutosaveControllerReturn } from './useAutosaveController';
export { useAutosaveField } from './useAutosaveField';
export type { AutosaveFieldOptions, AutosaveFieldReturn, FieldType } from './useAutosaveField';
export { 
  normalizeStringValue, 
  normalizeFormData, 
  hasFieldChanged, 
  hasMeaningfulDiff 
} from './normalizeValue';
