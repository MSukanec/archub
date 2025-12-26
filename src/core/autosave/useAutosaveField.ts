/**
 * Enterprise Autosave Field Hook
 * 
 * For individual input fields with enterprise-grade autosave behavior:
 * - onChange only updates local draft state (NO save)
 * - onBlur triggers save
 * - Enter key triggers save
 * - For selects/toggles: onChange triggers immediate save
 * 
 * Usage:
 * const { value, onChange, onBlur, onKeyDown } = useAutosaveField({
 *   initialValue: projectName,
 *   onSave: (value) => saveController.save({ ...formData, name: value }),
 *   type: 'text'
 * });
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { normalizeStringValue } from './normalizeValue';
export type FieldType = 'text'| 'textarea'| 'select'| 'toggle';
export interface AutosaveFieldOptions<T> {
  initialValue: T;
  onSave: (value: T) => void;
  type?: FieldType;
  normalize?: boolean;
}
export interface AutosaveFieldReturn<T> {
  value: T;
  setValue: (value: T) => void;
  onChange: (valueOrEvent: T | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isDirty: boolean;
  reset: (newValue: T) => void;
}
export function useAutosaveField<T>({
  initialValue,
  onSave,
  type = 'text',
  normalize = true,
}: AutosaveFieldOptions<T>): AutosaveFieldReturn<T> {
  const [value, setValue] = useState<T>(initialValue);
  const [isDirty, setIsDirty] = useState(false);
  const initialValueRef = useRef<T>(initialValue);
  const isHydratedRef = useRef(false);
  useEffect(() => {
    if (!isHydratedRef.current) {
      setValue(initialValue);
      initialValueRef.current = initialValue;
      isHydratedRef.current = true;
    }
  }, [initialValue]);
  const normalizeValue = useCallback((val: T): T => {
    if (!normalize) return val;
    if (typeof val === 'string') {
      return normalizeStringValue(val) as unknown as T;
    }
    return val;
  }, [normalize]);
  const triggerSave = useCallback(() => {
    if (!isDirty) return;
    
    const normalizedValue = normalizeValue(value);
    const normalizedInitial = normalizeValue(initialValueRef.current);
    
    if (normalizedValue === normalizedInitial) {
      setIsDirty(false);
      return;
    }
    
    onSave(normalizedValue);
    initialValueRef.current = normalizedValue;
    setIsDirty(false);
  }, [value, isDirty, normalizeValue, onSave]);
  const onChange = useCallback((valueOrEvent: T | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue: T;
    
    if (valueOrEvent && typeof valueOrEvent === 'object'&& 'target'in valueOrEvent) {
      newValue = (valueOrEvent as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>).target.value as unknown as T;
    } else {
      newValue = valueOrEvent as T;
    }
    
    setValue(newValue);
    setIsDirty(true);
    
    if (type === 'select'|| type === 'toggle') {
      const normalizedValue = normalize && typeof newValue === 'string'
        ? normalizeStringValue(newValue) as unknown as T 
        : newValue;
      onSave(normalizedValue);
      initialValueRef.current = normalizedValue;
      setIsDirty(false);
    }
  }, [type, normalize, onSave]);
  const onBlur = useCallback(() => {
    if (type === 'text'|| type === 'textarea') {
      triggerSave();
    }
  }, [type, triggerSave]);
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter'&& type === 'text') {
      e.preventDefault();
      triggerSave();
    }
  }, [type, triggerSave]);
  const reset = useCallback((newValue: T) => {
    setValue(newValue);
    initialValueRef.current = newValue;
    setIsDirty(false);
  }, []);
  return {
    value,
    setValue,
    onChange,
    onBlur,
    onKeyDown,
    isDirty,
    reset,
  };
}
