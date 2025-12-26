import { useMemo, useCallback } from 'react';
import { isValidUUID, parseDate, parseNumber } from '../utils/normalize';
import type { TargetField, ColumnMapping, ParsedData, ValidationError, ManualMapping } from '../types';
interface UseValidationEngineProps {
  targetSchema: TargetField[];
  parsedData: ParsedData | null;
  columnMapping: ColumnMapping;
  manualMappings?: ManualMapping;
  valueMapConfig?: Record<string, Record<string, string>>;
  defaultFieldValues?: Record<string, string>;
  cellCorrections?: Record<string, string>;
}
interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warnings: number;
  errors: number;
  missingRequiredFields: string[];
  unmappedColumns: number[];
}
interface UseValidationEngineReturn {
  errors: ValidationError[];
  summary: ValidationSummary;
  validateRow: (rowIndex: number) => ValidationError[];
  validateAll: () => ValidationError[];
  isRowValid: (rowIndex: number) => boolean;
  getRowErrors: (rowIndex: number) => ValidationError[];
}
export function useValidationEngine({
  targetSchema,
  parsedData,
  columnMapping,
  manualMappings = {},
  valueMapConfig = {},
  defaultFieldValues = {},
  cellCorrections = {},
}: UseValidationEngineProps): UseValidationEngineReturn {
  const requiredFields = useMemo(() => {
    return targetSchema.filter(f => f.required).map(f => f.field);
  }, [targetSchema]);
  const mappedFields = useMemo(() => {
    return new Set(Object.values(columnMapping).filter(Boolean) as string[]);
  }, [columnMapping]);
  const missingRequiredFields = useMemo(() => {
    return requiredFields.filter(field => {
      // Field is covered if it's mapped from file OR has a default value
      const isMapped = mappedFields.has(field);
      const hasDefaultValue = defaultFieldValues[field] !== undefined && defaultFieldValues[field] !== '';
      return !isMapped && !hasDefaultValue;
    });
  }, [requiredFields, mappedFields, defaultFieldValues]);
  const unmappedColumns = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.headers
      .map((_, index) => index)
      .filter(index => columnMapping[index] === undefined || columnMapping[index] === null);
  }, [parsedData, columnMapping]);
  const validateValue = useCallback((field: string, value: any, rowIndex: number): ValidationError | null => {
    const fieldConfig = targetSchema.find(f => f.field === field);
    if (!fieldConfig) return null;
    const stringValue = value !== null && value !== undefined ? String(value).trim() : '';
    const isEmpty = stringValue === ''|| value === null || value === undefined;
    if (fieldConfig.required && isEmpty) {
      return {
        row: rowIndex,
        column: field,
        field,
        message: `"${fieldConfig.label}" es obligatorio`,
        value,
        severity: 'error',
      };
    }
    if (isEmpty) return null;
    const mappingKey = `${field}_${stringValue}`;
    if (manualMappings[mappingKey] !== undefined) {
      return null;
    }
    switch (fieldConfig.type) {
      case 'foreign-key': {
        const fieldValueMap = valueMapConfig[field];
        const foreignKeyOptions = fieldConfig.foreignKeyConfig?.options || [];
        const normalized = stringValue.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        
        // Check in valueMapConfig first
        let hasMatch = false;
        if (fieldValueMap) {
          hasMatch = Object.keys(fieldValueMap).some(key => 
            key === normalized || 
            key.includes(normalized) || 
            normalized.includes(key)
          );
        }
        
        // Then check in foreignKeyConfig options
        if (!hasMatch && foreignKeyOptions.length > 0) {
          hasMatch = foreignKeyOptions.some(opt => {
            const optLabel = opt.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            return optLabel === normalized || optLabel.includes(normalized) || normalized.includes(optLabel);
          });
        }
        
        // If still no match and not a UUID, it's a warning (will be resolved in conflicts step)
        if (!hasMatch && !isValidUUID(stringValue)) {
          return {
            row: rowIndex,
            column: field,
            field,
            message: `"${stringValue}" no se encontró en el sistema`,
            value,
            severity: 'warning',
          };
        }
        break;
      }
      case 'date': {
        const date = parseDate(stringValue);
        if (!date) {
          return {
            row: rowIndex,
            column: field,
            field,
            message: `"${stringValue}" no es una fecha válida`,
            value,
            severity: 'error',
          };
        }
        break;
      }
      case 'number':
      case 'currency': {
        const num = parseNumber(stringValue);
        if (num === null) {
          return {
            row: rowIndex,
            column: field,
            field,
            message: `"${stringValue}" no es un número válido`,
            value,
            severity: 'error',
          };
        }
        break;
      }
    }
    return null;
  }, [targetSchema, manualMappings, valueMapConfig]);
  const validateRow = useCallback((rowIndex: number): ValidationError[] => {
    if (!parsedData || rowIndex >= parsedData.rows.length) return [];
    const row = parsedData.rows[rowIndex];
    const errors: ValidationError[] = [];
    for (const [colIndexStr, field] of Object.entries(columnMapping)) {
      if (!field) continue;
      
      // Check if this cell has a correction (using || separator)
      const correctionKey = `${rowIndex}||${field}`;
      if (cellCorrections[correctionKey]) {
        // Cell has been corrected, skip validation for this field
        continue;
      }
      
      const colIndex = parseInt(colIndexStr);
      const value = row[colIndex];
      const error = validateValue(field, value, rowIndex);
      if (error) {
        errors.push(error);
      }
    }
    for (const requiredField of requiredFields) {
      // Skip if field is mapped from file OR has a default value OR has a cell correction
      const isMapped = mappedFields.has(requiredField);
      const hasDefaultValue = defaultFieldValues[requiredField] !== undefined && defaultFieldValues[requiredField] !== '';
      // Use || as separator for cell corrections
      const correctionKey = `${rowIndex}||${requiredField}`;
      const hasCellCorrection = cellCorrections[correctionKey] !== undefined && cellCorrections[correctionKey] !== '';
      
      if (!isMapped && !hasDefaultValue && !hasCellCorrection) {
        const fieldConfig = targetSchema.find(f => f.field === requiredField);
        errors.push({
          row: rowIndex,
          column: requiredField,
          field: requiredField,
          message: `Campo "${fieldConfig?.label || requiredField}" no está mapeado`,
          value: null,
          severity: 'error',
        });
      }
    }
    return errors;
  }, [parsedData, columnMapping, validateValue, requiredFields, mappedFields, targetSchema, defaultFieldValues, cellCorrections]);
  const allErrors = useMemo(() => {
    if (!parsedData) return [];
    
    const errors: ValidationError[] = [];
    for (let i = 0; i < parsedData.rows.length; i++) {
      errors.push(...validateRow(i));
    }
    return errors;
  }, [parsedData, validateRow]);
  const validateAll = useCallback(() => {
    return allErrors;
  }, [allErrors]);
  const isRowValid = useCallback((rowIndex: number): boolean => {
    const rowErrors = allErrors.filter(e => e.row === rowIndex && e.severity === 'error');
    return rowErrors.length === 0;
  }, [allErrors]);
  const getRowErrors = useCallback((rowIndex: number): ValidationError[] => {
    return allErrors.filter(e => e.row === rowIndex);
  }, [allErrors]);
  const summary = useMemo((): ValidationSummary => {
    if (!parsedData) {
      return {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        warnings: 0,
        errors: 0,
        missingRequiredFields,
        unmappedColumns,
      };
    }
    const errorsByRow = new Map<number, { hasError: boolean; hasWarning: boolean }>();
    
    for (const error of allErrors) {
      const existing = errorsByRow.get(error.row) || { hasError: false, hasWarning: false };
      if (error.severity === 'error') existing.hasError = true;
      if (error.severity === 'warning') existing.hasWarning = true;
      errorsByRow.set(error.row, existing);
    }
    let validRows = 0;
    let invalidRows = 0;
    
    for (let i = 0; i < parsedData.rows.length; i++) {
      const rowStatus = errorsByRow.get(i);
      if (!rowStatus || !rowStatus.hasError) {
        validRows++;
      } else {
        invalidRows++;
      }
    }
    return {
      totalRows: parsedData.rows.length,
      validRows,
      invalidRows,
      warnings: allErrors.filter(e => e.severity === 'warning').length,
      errors: allErrors.filter(e => e.severity === 'error').length,
      missingRequiredFields,
      unmappedColumns,
    };
  }, [parsedData, allErrors, missingRequiredFields, unmappedColumns]);
  return {
    errors: allErrors,
    summary,
    validateRow,
    validateAll,
    isRowValid,
    getRowErrors,
  };
}
