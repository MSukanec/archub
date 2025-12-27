import { useState, useCallback, useMemo, useEffect } from 'react';
import { Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/features/users/hooks';
import { useProjectContext } from '@/stores/projectContext';
import { useUpdateUserOrganizationPreferences } from '@/features/organization';

import { useFileParser } from '../hooks/useFileParser';
import { useColumnAutoMap } from '../hooks/useColumnAutoMap';
import { useValidationEngine } from '../hooks/useValidationEngine';
import { useAISuggestMapping } from '../hooks/useAISuggestMapping';

import { StepPreview } from '../steps/StepPreview';
import { StepMapping } from '../steps/StepMapping';
import { StepValidation } from '../steps/StepValidation';
import { StepConflicts } from '../steps/StepConflicts';
import { StepSummary } from '../steps/StepSummary';

import type { 
  ImportConfig, 
  ColumnMapping, 
  ManualMapping,
  IMPORT_STEPS 
} from '../types';

/**
 * Parse various date formats to ISO (YYYY-MM-DD)
 * Supports: DD/MM, DD/MM/YY, DD/MM/YYYY, DD-MM-YYYY, etc.
 * Also supports ISO format (YYYY-MM-DD) which passes through unchanged.
 */
function parseDateToISO(value: string): string | null {
  if (!value) return null;
  
  const cleaned = value.trim();
  
  // Already in ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Handle DD/MM/YYYY or DD-MM-YYYY
  const fullDateMatch = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (fullDateMatch) {
    const day = fullDateMatch[1].padStart(2, '0');
    const month = fullDateMatch[2].padStart(2, '0');
    const year = fullDateMatch[3];
    return `${year}-${month}-${day}`;
  }
  
  // Handle DD/MM/YY (2-digit year)
  const shortYearMatch = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})$/);
  if (shortYearMatch) {
    const day = shortYearMatch[1].padStart(2, '0');
    const month = shortYearMatch[2].padStart(2, '0');
    const shortYear = parseInt(shortYearMatch[3]);
    // Assume 2000s for years < 50, 1900s otherwise
    const year = shortYear < 50 ? 2000 + shortYear : 1900 + shortYear;
    return `${year}-${month}-${day}`;
  }
  
  // Handle DD/MM (current year)
  const dayMonthMatch = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
  if (dayMonthMatch) {
    const day = dayMonthMatch[1].padStart(2, '0');
    const month = dayMonthMatch[2].padStart(2, '0');
    const year = new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }
  
  // Try to parse as Date object (for Excel serial numbers or other formats)
  const dateObj = new Date(cleaned);
  if (!isNaN(dateObj.getTime())) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null; // Could not parse
}

interface UniversalImportFormProps {
  modalData?: {
    config: ImportConfig;
  };
  onClose: () => void;
}

const STEP_NAMES = ['Vista Previa', 'Mapeo', 'Validación', 'Conflictos', 'Resumen'];

export function UniversalImportForm({ modalData, onClose }: UniversalImportFormProps) {
  const config = modalData?.config;
  
  if (!config) {
    return (
      <ModalLayout onClose={onClose} size="lg">
        <ModalHeader 
          title="Error de configuración" 
          description="No se proporcionó la configuración de importación"
          icon={Upload}
        />
        <ModalBody>
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              Falta la configuración del importador. Contacta al administrador.
            </p>
          </div>
        </ModalBody>
      </ModalLayout>
    );
  }

  return <ImportFormContent config={config} onClose={onClose} />;
}

interface ImportFormContentProps {
  config: ImportConfig;
  onClose: () => void;
}

function ImportFormContent({ config, onClose }: ImportFormContentProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id || userData?.organization?.id;
  const userId = userData?.user?.id;
  
  // Global project context hooks (to change context like the header selector)
  const { setSelectedProject, currentOrganizationId } = useProjectContext();
  const updatePreferencesMutation = useUpdateUserOrganizationPreferences(userId);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [manualMappings, setManualMappings] = useState<ManualMapping>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [aiConfidence, setAIConfidence] = useState<Record<string, number>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [contextOverrideToOrg, setContextOverrideToOrg] = useState(false);
  const [defaultFieldValues, setDefaultFieldValues] = useState<Record<string, string>>({});
  const [cellCorrections, setCellCorrections] = useState<Record<string, string>>({});

  const { suggestMapping, saveMappings, isLoading: isLoadingAI } = useAISuggestMapping();

  const { 
    parsedData, 
    isLoading: isParsingFile, 
    error: parseError, 
    parseFile, 
    reset: resetParser 
  } = useFileParser();

  // Detectar si hay columna de proyecto en el archivo (must be before other useMemos that depend on it)
  const projectColumnDetection = useMemo(() => {
    if (!parsedData) return { hasProjectColumn: false, projectColumnIndex: -1 };
    
    const projectKeywords = ['proyecto', 'project', 'obra', 'propiedad', 'unidad de negocio'];
    
    const projectColumnIndex = parsedData.headers.findIndex(header => {
      const normalizedHeader = header.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return projectKeywords.some(keyword => 
        normalizedHeader === keyword || 
        normalizedHeader.includes(keyword) ||
        keyword.includes(normalizedHeader)
      );
    });
    
    return {
      hasProjectColumn: projectColumnIndex !== -1,
      projectColumnIndex,
    };
  }, [parsedData]);

  // Detectar si hay columna de cliente en el archivo
  const clientColumnDetection = useMemo(() => {
    if (!parsedData) return { hasClientColumn: false, clientColumnIndex: -1 };
    
    const clientKeywords = ['cliente', 'client', 'customer', 'comprador'];
    
    const clientColumnIndex = parsedData.headers.findIndex(header => {
      const normalizedHeader = header.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return clientKeywords.some(keyword => 
        normalizedHeader === keyword || 
        normalizedHeader.includes(keyword) ||
        keyword.includes(normalizedHeader)
      );
    });
    
    return {
      hasClientColumn: clientColumnIndex !== -1,
      clientColumnIndex,
    };
  }, [parsedData]);

  // Effective project context: allows overriding from project to organization
  const effectiveProjectContext = useMemo(() => {
    if (contextOverrideToOrg && config.projectContext?.type === 'project') {
      return {
        type: 'organization' as const,
        organizationId: organizationId || '',
        organizationName: 'Organización',
      };
    }
    return config.projectContext;
  }, [config.projectContext, contextOverrideToOrg, organizationId]);

  // Detect conflict: project context + project column = should block or switch to org
  const hasProjectContextConflict = useMemo(() => {
    return config.projectContext?.type === 'project' && 
           projectColumnDetection.hasProjectColumn && 
           !contextOverrideToOrg;
  }, [config.projectContext, projectColumnDetection.hasProjectColumn, contextOverrideToOrg]);

  // Dynamically extend schema to include project_name field when importing at org level with project column
  // Also extends when user has overridden project context to organization
  // Additionally, merge availableClients into client_name field's foreignKeyConfig.options
  const extendedSchema = useMemo(() => {
    const shouldAddProjectField = 
      (effectiveProjectContext?.type === 'organization' && projectColumnDetection.hasProjectColumn && config.availableProjects?.length) ||
      (contextOverrideToOrg && projectColumnDetection.hasProjectColumn && config.availableProjects?.length);
    
    let schema = [...config.targetSchema];
    
    // Merge availableClients into client_name field if it exists and has availableClients
    if (config.availableClients?.length) {
      schema = schema.map(field => {
        if (field.field === 'client_name' && field.type === 'foreign-key') {
          return {
            ...field,
            foreignKeyConfig: {
              ...field.foreignKeyConfig,
              entityName: field.foreignKeyConfig?.entityName || 'client',
              labelKey: field.foreignKeyConfig?.labelKey || 'label',
              valueKey: field.foreignKeyConfig?.valueKey || 'value',
              options: config.availableClients!.map(c => ({ label: c.name, value: c.id }))
            }
          };
        }
        return field;
      });
    }
    
    if (shouldAddProjectField) {
      return [
        ...schema,
        {
          field: 'project_name',
          label: 'Proyecto',
          type: 'foreign-key' as const,
          required: true,
          description: 'Proyecto al que pertenece el registro',
          foreignKeyConfig: {
            entityName: 'project',
            labelKey: 'label',
            valueKey: 'value',
            options: config.availableProjects!.map(p => ({ label: p.name, value: p.id }))
          }
        }
      ];
    }
    return schema;
  }, [config.targetSchema, effectiveProjectContext, projectColumnDetection.hasProjectColumn, config.availableProjects, contextOverrideToOrg, config.availableClients]);

  const { 
    autoMapping, 
    unmappedHeaders, 
    unmappedFields,
    getSuggestions 
  } = useColumnAutoMap({
    headers: parsedData?.headers || [],
    targetSchema: extendedSchema,
    customMapping: config.smartColumnMapping,
  });

  useEffect(() => {
    if (parsedData && Object.keys(columnMapping).length === 0 && Object.keys(autoMapping).length > 0) {
      // When importing to a specific project, exclude the project column from auto-mapping
      let filteredAutoMapping = { ...autoMapping };
      if (config.projectContext?.type === 'project' && projectColumnDetection.hasProjectColumn) {
        const { projectColumnIndex } = projectColumnDetection;
        if (projectColumnIndex !== -1) {
          delete filteredAutoMapping[projectColumnIndex];
        }
      }
      
      setColumnMapping(filteredAutoMapping);
      
      if (organizationId && parsedData.headers.length > 0) {
        // Filter headers and schema for AI suggestion when in project context
        const headersForAI = config.projectContext?.type === 'project' && projectColumnDetection.hasProjectColumn
          ? parsedData.headers.filter((_, i) => i !== projectColumnDetection.projectColumnIndex)
          : parsedData.headers;
        
        const schemaForAI = config.projectContext?.type === 'project'
          ? config.targetSchema.filter(f => f.field !== 'project_id' && f.field !== 'project_name' && f.field !== 'project')
          : config.targetSchema;
        
        suggestMapping({
          headers: headersForAI,
          sampleRows: parsedData.rows.slice(0, 5).map(row => 
            Object.fromEntries(headersForAI.map((h) => {
              const originalIndex = parsedData.headers.indexOf(h);
              return [h, row[originalIndex]];
            }))
          ),
          targetSchema: schemaForAI,
          entity: config.entityName.toLowerCase().replace(/\s+/g, '_'),
          organizationId
        }).then(result => {
          if (Object.keys(result.mapping).length > 0) {
            const updatedMapping = { ...filteredAutoMapping };
            const updatedConfidence: Record<string, number> = {};
            
            for (const [header, field] of Object.entries(result.mapping)) {
              const headerIndex = parsedData.headers.findIndex(h => h === header);
              // Skip project column when in project context
              if (config.projectContext?.type === 'project' && headerIndex === projectColumnDetection.projectColumnIndex) {
                continue;
              }
              if (headerIndex !== -1 && !filteredAutoMapping[headerIndex]) {
                updatedMapping[headerIndex] = field;
                updatedConfidence[header] = result.confidence[header] || 0.8;
              }
            }
            
            setColumnMapping(updatedMapping);
            setAIConfidence(updatedConfidence);
          }
        });
      }
    }
  }, [parsedData, autoMapping, columnMapping, organizationId, config.targetSchema, config.entityName, suggestMapping, config.projectContext, projectColumnDetection]);

  const { 
    errors: validationErrors, 
    summary: validationSummary,
    isRowValid,
    getRowErrors 
  } = useValidationEngine({
    targetSchema: extendedSchema,
    parsedData,
    columnMapping,
    manualMappings,
    valueMapConfig: config.valueMapConfig,
    defaultFieldValues,
    cellCorrections,
  });

  const conflicts = useMemo(() => {
    if (!parsedData) return [];
    
    const conflictGroups: Array<{
      field: string;
      fieldLabel: string;
      originalValues: string[];
      options: Array<{ label: string; value: string }>;
    }> = [];

    const foreignKeyFields = extendedSchema.filter(f => f.type === 'foreign-key');

    for (const field of foreignKeyFields) {
      const columnIndex = Object.entries(columnMapping).find(([_, f]) => f === field.field)?.[0];
      if (!columnIndex) continue;

      const colIdx = parseInt(columnIndex);
      const uniqueValues = new Set<string>();
      
      parsedData.rows.forEach(row => {
        const value = row[colIdx];
        if (value && String(value).trim()) {
          uniqueValues.add(String(value).trim());
        }
      });

      const unmatchedValues: string[] = [];
      const valueMap = config.valueMapConfig?.[field.field] || {};
      const valueMapKeys = Object.keys(valueMap);
      
      // Also get options from foreignKeyConfig for matching
      const foreignKeyOptions = field.foreignKeyConfig?.options || [];
      const foreignKeyLabels = foreignKeyOptions.map(opt => opt.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());

      uniqueValues.forEach(value => {
        const normalized = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        
        // Check in valueMap first
        let hasMatch = valueMapKeys.some(key => key === normalized);
        
        if (!hasMatch) {
          hasMatch = valueMapKeys.some(key => 
            key.includes(normalized) || normalized.includes(key)
          );
        }
        
        // Then check in foreignKeyConfig options (exact match)
        if (!hasMatch) {
          hasMatch = foreignKeyLabels.some(label => label === normalized);
        }
        
        // Fuzzy match in valueMap (only for very similar values, 80% threshold)
        if (!hasMatch && normalized.length > 3) {
          for (const key of valueMapKeys) {
            if (key.length > 3) {
              const longer = normalized.length > key.length ? normalized : key;
              const shorter = normalized.length > key.length ? key : normalized;
              let matches = 0;
              for (let i = 0; i < shorter.length; i++) {
                if (longer.includes(shorter[i])) matches++;
              }
              const similarity = matches / longer.length;
              if (similarity > 0.8) {
                hasMatch = true;
                break;
              }
            }
          }
        }
        
        // Fuzzy match in foreignKeyConfig options (only for very similar values, 80% threshold)
        if (!hasMatch && normalized.length > 3) {
          for (const label of foreignKeyLabels) {
            if (label.length > 3) {
              const longer = normalized.length > label.length ? normalized : label;
              const shorter = normalized.length > label.length ? label : normalized;
              let matches = 0;
              for (let i = 0; i < shorter.length; i++) {
                if (longer.includes(shorter[i])) matches++;
              }
              const similarity = matches / longer.length;
              if (similarity > 0.8) {
                hasMatch = true;
                break;
              }
            }
          }
        }
        
        if (!hasMatch) {
          unmatchedValues.push(value);
        }
      });

      if (unmatchedValues.length > 0) {
        const options = field.foreignKeyConfig?.options || 
          Object.entries(valueMap).map(([key, val]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: val as string,
          }));

        conflictGroups.push({
          field: field.field,
          fieldLabel: field.label,
          originalValues: unmatchedValues,
          options,
        });
      }
    }

    return conflictGroups;
  }, [parsedData, extendedSchema, columnMapping, config.valueMapConfig]);

  // Calculate successful mappings - values that are NOT in conflicts
  // This ensures mutual exclusivity: a value is either successful OR a conflict, never both
  const successfulMappings = useMemo(() => {
    if (!parsedData) return [];
    
    // Build a set of all conflict values for quick lookup
    const conflictValues = new Set<string>();
    for (const conflict of conflicts) {
      for (const value of conflict.originalValues) {
        conflictValues.add(`${conflict.field}_${value}`);
      }
    }
    
    const mappingGroups: Array<{
      field: string;
      fieldLabel: string;
      mappings: Array<{ originalValue: string; mappedTo: string; mappedLabel: string }>;
      options: Array<{ label: string; value: string }>;
    }> = [];

    const foreignKeyFields = extendedSchema.filter(f => f.type === 'foreign-key');

    for (const field of foreignKeyFields) {
      const columnIndex = Object.entries(columnMapping).find(([_, f]) => f === field.field)?.[0];
      // Note: For successful mappings, we also want to show fields that were NOT mapped from the file
      // but have values coming from valueMapConfig or foreignKeyConfig (e.g., wallets matched via valueMap)
      
      const colIdx = columnIndex ? parseInt(columnIndex) : -1;
      const uniqueValues = new Set<string>();
      
      // Collect unique values from the file column (if mapped)
      if (colIdx >= 0) {
        parsedData.rows.forEach(row => {
          const value = row[colIdx];
          if (value && String(value).trim()) {
            uniqueValues.add(String(value).trim());
          }
        });
      }

      const matchedMappings: Array<{ originalValue: string; mappedTo: string; mappedLabel: string }> = [];
      const valueMap = config.valueMapConfig?.[field.field] || {};
      const valueMapKeys = Object.keys(valueMap);
      const foreignKeyOptions = field.foreignKeyConfig?.options || [];
      
      // Build options list for the SELECT (same as conflicts do)
      const options = foreignKeyOptions.length > 0 
        ? foreignKeyOptions 
        : Object.entries(valueMap).map(([key, val]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: val as string,
          }));

      uniqueValues.forEach(value => {
        // Skip if this value is in conflicts - it's NOT a successful mapping
        const conflictKey = `${field.field}_${value}`;
        if (conflictValues.has(conflictKey)) {
          return;
        }
        
        const normalized = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        
        let mappedValue: string | null = null;
        let mappedLabel: string | null = null;
        
        // 1. Check valueMap first (exact or partial match)
        if (valueMapKeys.includes(normalized)) {
          mappedValue = valueMap[normalized];
        } else {
          for (const key of valueMapKeys) {
            if (key.includes(normalized) || normalized.includes(key)) {
              mappedValue = valueMap[key];
              break;
            }
          }
        }
        
        // 2. If found in valueMap, get display label from foreignKeyOptions
        if (mappedValue) {
          const matchingOption = foreignKeyOptions.find(opt => opt.value === mappedValue);
          mappedLabel = matchingOption?.label || normalized.charAt(0).toUpperCase() + normalized.slice(1);
        }
        
        // 3. Check foreignKeyConfig options if not found in valueMap
        if (!mappedValue) {
          for (const opt of foreignKeyOptions) {
            const optLabel = opt.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            if (optLabel === normalized || optLabel.includes(normalized) || normalized.includes(optLabel)) {
              mappedValue = opt.value;
              mappedLabel = opt.label;
              break;
            }
          }
        }
        
        // 4. Fuzzy match (80% threshold) - these also count as successful since they pass conflicts check
        if (!mappedValue && normalized.length > 3) {
          for (const key of valueMapKeys) {
            if (key.length > 3) {
              const longer = normalized.length > key.length ? normalized : key;
              const shorter = normalized.length > key.length ? key : normalized;
              let matches = 0;
              for (let i = 0; i < shorter.length; i++) {
                if (longer.includes(shorter[i])) matches++;
              }
              const similarity = matches / longer.length;
              if (similarity > 0.8) {
                mappedValue = valueMap[key];
                const matchingOption = foreignKeyOptions.find(opt => opt.value === mappedValue);
                mappedLabel = matchingOption?.label || key.charAt(0).toUpperCase() + key.slice(1);
                break;
              }
            }
          }
        }
        
        // 5. Fuzzy match in foreignKeyConfig
        if (!mappedValue && normalized.length > 3) {
          for (const opt of foreignKeyOptions) {
            const optLabel = opt.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            if (optLabel.length > 3) {
              const longer = normalized.length > optLabel.length ? normalized : optLabel;
              const shorter = normalized.length > optLabel.length ? optLabel : normalized;
              let matches = 0;
              for (let i = 0; i < shorter.length; i++) {
                if (longer.includes(shorter[i])) matches++;
              }
              const similarity = matches / longer.length;
              if (similarity > 0.8) {
                mappedValue = opt.value;
                mappedLabel = opt.label;
                break;
              }
            }
          }
        }
        
        // If we found a match (and it's not in conflicts), add to successful mappings
        if (mappedValue && mappedLabel) {
          matchedMappings.push({
            originalValue: value,
            mappedTo: mappedValue,
            mappedLabel: mappedLabel,
          });
        }
      });

      if (matchedMappings.length > 0) {
        mappingGroups.push({
          field: field.field,
          fieldLabel: field.label,
          mappings: matchedMappings,
          options, // Include options for SELECT editing
        });
      }
    }

    return mappingGroups;
  }, [parsedData, extendedSchema, columnMapping, config.valueMapConfig, conflicts]);

  const handleMappingChange = useCallback((columnIndex: number, field: string | null) => {
    setColumnMapping(prev => {
      const next = { ...prev };
      if (field === null) {
        delete next[columnIndex];
      } else {
        for (const [key, value] of Object.entries(next)) {
          if (value === field && parseInt(key) !== columnIndex) {
            delete next[parseInt(key)];
          }
        }
        next[columnIndex] = field;
      }
      return next;
    });
    
    if (parsedData) {
      const header = parsedData.headers[columnIndex];
      if (header && aiConfidence[header] !== undefined) {
        setAIConfidence(prev => {
          const next = { ...prev };
          delete next[header];
          return next;
        });
      }
    }
  }, [parsedData, aiConfidence]);

  const handleManualMappingChange = useCallback((field: string, originalValue: string, mappedValue: string | null) => {
    const key = `${field}_${originalValue}`;
    setManualMappings(prev => {
      if (mappedValue === null) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: mappedValue };
    });
  }, []);

  const handleCellCorrectionChange = useCallback((rowIndex: number, field: string, value: string) => {
    // Use || as separator since field names contain underscores
    const key = `${rowIndex}||${field}`;
    setCellCorrections(prev => {
      if (!value || value.trim() === '') {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value.trim() };
    });
  }, []);

  const handleImport = async () => {
    if (!parsedData) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const mappedRows: Record<string, any>[] = [];
      
      for (let i = 0; i < parsedData.rows.length; i++) {
        if (!isRowValid(i)) continue;

        const row = parsedData.rows[i];
        const mappedRow: Record<string, any> = {};

        for (const [colIndexStr, field] of Object.entries(columnMapping)) {
          if (!field) continue;
          const colIndex = parseInt(colIndexStr);
          let value = row[colIndex];

          const mappingKey = `${field}_${String(value).trim()}`;
          if (manualMappings[mappingKey] !== undefined) {
            const mappedValue = manualMappings[mappingKey];
            // If mapped to empty string (skip/omit), set value to null
            value = mappedValue === '' ? null : mappedValue;
          }

          mappedRow[field] = value;
        }

        // Apply cell corrections for empty cells that user filled in
        for (const [correctionKey, correctionValue] of Object.entries(cellCorrections)) {
          // Use || as separator since field names contain underscores
          const separatorIndex = correctionKey.indexOf('||');
          if (separatorIndex === -1) continue;
          const rowIndexStr = correctionKey.substring(0, separatorIndex);
          const fieldName = correctionKey.substring(separatorIndex + 2);
          const correctionRowIndex = parseInt(rowIndexStr);
          if (correctionRowIndex === i && correctionValue) {
            // Override the value with the user correction
            mappedRow[fieldName] = correctionValue;
          }
        }

        // Inject default values for fields that weren't in the file
        for (const [fieldName, fieldValue] of Object.entries(defaultFieldValues)) {
          // Only inject if field wasn't already mapped from file AND wasn't corrected
          if (mappedRow[fieldName] === undefined || mappedRow[fieldName] === null || mappedRow[fieldName] === '') {
            mappedRow[fieldName] = fieldValue;
          }
        }

        // Inject _projectId based on context
        if (config.projectContext?.type === 'organization') {
          if (!projectColumnDetection.hasProjectColumn) {
            // Use selected project from dropdown
            mappedRow._projectId = selectedProjectId;
          } else {
            // Use the mapped project_name value (which should be project ID after manual mapping)
            const projectValue = mappedRow.project_name;
            if (projectValue) {
              // Check if already a valid ID (from manual mapping in conflicts step)
              const isProjectId = config.availableProjects?.some(p => p.id === projectValue);
              if (isProjectId) {
                mappedRow._projectId = projectValue;
              } else {
                // Try to match by name
                const matchedProject = config.availableProjects?.find(p => 
                  p.name.toLowerCase().trim() === String(projectValue).toLowerCase().trim()
                );
                mappedRow._projectId = matchedProject?.id || null;
              }
            }
            // Clean up the project_name field as we've extracted _projectId
            delete mappedRow.project_name;
          }
        } else if (config.projectContext?.type === 'project') {
          // For project context, use the project from context
          mappedRow._projectId = config.projectContext.projectId;
        }

        // Convert date fields to ISO format (YYYY-MM-DD)
        for (const schemaField of config.targetSchema) {
          if (schemaField.type === 'date' && mappedRow[schemaField.field]) {
            const rawValue = String(mappedRow[schemaField.field]).trim();
            const parsedDate = parseDateToISO(rawValue);
            if (parsedDate) {
              mappedRow[schemaField.field] = parsedDate;
            }
            // If parsing fails, keep original value - database will show the error
          }
        }

        // Inject _clientId based on client column detection
        if (!clientColumnDetection.hasClientColumn && selectedClientId) {
          // Use selected client from dropdown when no client column in file
          mappedRow._clientId = selectedClientId;
        } else if (clientColumnDetection.hasClientColumn) {
          // Client mapping happens in conflicts step via manual mappings
          // The client_name field will be processed through foreignKeyConfig
          const clientValue = mappedRow.client_name;
          if (clientValue) {
            // Check if already a valid ID (from manual mapping in conflicts step)
            const isClientId = config.availableClients?.some(c => c.id === clientValue);
            if (isClientId) {
              mappedRow._clientId = clientValue;
            } else {
              // Try to match by name
              const matchedClient = config.availableClients?.find(c => 
                c.name.toLowerCase().trim() === String(clientValue).toLowerCase().trim()
              );
              mappedRow._clientId = matchedClient?.id || null;
            }
          } else {
            // If clientValue is null (from "Omitir valor" mapping), explicitly set _clientId to null
            mappedRow._clientId = null;
          }
          // Clean up the client_name field as we've extracted _clientId
          delete mappedRow.client_name;
        }

        mappedRows.push(mappedRow);
      }

      // Reset progress to 0 before starting actual import
      setImportProgress(0);

      // Create progress callback for the actual import process
      const onProgress = (current: number, total: number) => {
        setImportProgress(Math.round((current / total) * 100));
      };

      await config.onImport(mappedRows, onProgress);

      toast({
        title: "Importación exitosa",
        description: `Se importaron ${mappedRows.length} ${config.entityNamePlural} correctamente`,
      });

      onClose();
    } catch (error) {
      console.error('Import error:', error instanceof Error ? error.message : error, error);
      toast({
        title: "Error en la importación",
        description: error instanceof Error ? error.message : "Ocurrió un error durante la importación",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 1:
        return parsedData !== null;
      case 2: {
        // Block if project context + project column without override (user must switch to org context)
        if (hasProjectContextConflict) {
          return false;
        }
        
        // If organization context (or overridden to org) without project column, require selectedProjectId
        if (effectiveProjectContext?.type === 'organization' && 
            !projectColumnDetection.hasProjectColumn && 
            !selectedProjectId) {
          return false;
        }
        // Check if project column exists but is not mapped (when in org context or overridden)
        if (effectiveProjectContext?.type === 'organization' && 
            projectColumnDetection.hasProjectColumn) {
          const projectFieldMapped = Object.values(columnMapping).includes('project_name');
          if (!projectFieldMapped) {
            return false;
          }
        }
        
        // If availableClients exists but no client column in file, require selectedClientId
        if (!clientColumnDetection.hasClientColumn && 
            config.availableClients && 
            config.availableClients.length > 0 && 
            !selectedClientId) {
          return false;
        }
        
        return validationSummary.missingRequiredFields.length === 0;
      }
      case 3:
        // Only block on errors, warnings (like unmatched foreign-keys) can be resolved in conflicts step
        return validationSummary.errors === 0;
      case 4:
        return conflicts.every(c => 
          c.originalValues.every(v => manualMappings[`${c.field}_${v}`] !== undefined)
        ) || conflicts.length === 0;
      case 5:
        return validationSummary.validRows > 0;
      default:
        return false;
    }
  }, [currentStep, parsedData, validationSummary, conflicts, manualMappings, effectiveProjectContext, projectColumnDetection, selectedProjectId, columnMapping, hasProjectContextConflict, clientColumnDetection, config.availableClients, selectedClientId]);

  const goNext = () => {
    if (currentStep < 5 && canGoNext) {
      if (currentStep === 2 && organizationId && parsedData) {
        const mappingsToSave = Object.entries(columnMapping)
          .filter(([_, field]) => field)
          .map(([index, field]) => ({
            sourceHeader: parsedData.headers[parseInt(index)].toLowerCase().trim(),
            targetField: field!
          }));
        
        saveMappings({
          organizationId,
          entity: config.entityName.toLowerCase().replace(/\s+/g, '_'),
          mappings: mappingsToSave
        });
      }
      
      setCurrentStep(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleReset = () => {
    resetParser();
    setColumnMapping({});
    setManualMappings({});
    setCurrentStep(1);
  };

  const handleSwitchToOrgContext = useCallback(async () => {
    if (!currentOrganizationId) return;
    
    // Update preference in database to persist organization-wide view (same as header selector)
    await updatePreferencesMutation.mutateAsync({
      organizationId: currentOrganizationId,
      lastProjectId: null
    });
    
    // Set to null to indicate organization-wide view (same as header selector)
    setSelectedProject(null, currentOrganizationId);
    
    // Also set local state for immediate UI update
    setContextOverrideToOrg(true);
    
    // Re-trigger auto-mapping now that project_name field will be available
    setColumnMapping({});
    
    toast({
      title: 'Contexto actualizado',
      description: 'Ahora estás importando a nivel organización. Mapea la columna "Proyecto" al campo correspondiente.',
    });
  }, [currentOrganizationId, updatePreferencesMutation, setSelectedProject, toast]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepPreview
            parsedData={parsedData}
            isLoading={isParsingFile}
            error={parseError}
            onFileSelect={parseFile}
            onReset={handleReset}
          />
        );
      case 2:
        return parsedData ? (
          <StepMapping
            parsedData={parsedData}
            targetSchema={extendedSchema}
            columnMapping={columnMapping}
            onMappingChange={handleMappingChange}
            getSuggestions={getSuggestions}
            aiConfidence={aiConfidence}
            isLoadingAI={isLoadingAI}
            projectContext={effectiveProjectContext}
            hasProjectColumn={projectColumnDetection.hasProjectColumn}
            projectColumnIndex={projectColumnDetection.projectColumnIndex}
            availableProjects={config.availableProjects}
            selectedProjectId={selectedProjectId}
            onProjectSelect={setSelectedProjectId}
            hasProjectContextConflict={hasProjectContextConflict}
            onSwitchToOrgContext={handleSwitchToOrgContext}
            hasClientColumn={clientColumnDetection.hasClientColumn}
            clientColumnIndex={clientColumnDetection.clientColumnIndex}
            availableClients={config.availableClients}
            selectedClientId={selectedClientId}
            onClientSelect={setSelectedClientId}
            defaultFieldValues={defaultFieldValues}
            onDefaultFieldValueChange={(fieldName, value) => {
              setDefaultFieldValues(prev => ({ ...prev, [fieldName]: value }));
            }}
          />
        ) : null;
      case 3:
        return (
          <StepValidation
            errors={validationErrors}
            summary={validationSummary}
            targetSchema={extendedSchema}
            parsedData={parsedData}
            columnMapping={columnMapping}
            cellCorrections={cellCorrections}
            onCellCorrectionChange={handleCellCorrectionChange}
          />
        );
      case 4:
        return (
          <StepConflicts
            conflicts={conflicts}
            successfulMappings={successfulMappings}
            manualMappings={manualMappings}
            onManualMappingChange={handleManualMappingChange}
            targetSchema={extendedSchema}
            fieldHelpMessages={config.fieldHelpMessages}
            onCloseModal={onClose}
          />
        );
      case 5:
        return parsedData ? (
          <StepSummary
            parsedData={parsedData}
            columnMapping={columnMapping}
            targetSchema={config.targetSchema}
            validationSummary={validationSummary}
            entityName={config.entityNamePlural}
            isImporting={isImporting}
            importProgress={importProgress}
            onImport={handleImport}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <ModalLayout onClose={onClose} size="xl">
      <ModalHeader
        title={`Importar ${config.entityNamePlural}`}
        description={`Paso ${currentStep} de 5 • ${STEP_NAMES[currentStep - 1]}`}
        icon={Upload}
        progress={{
          current: currentStep,
          total: 5,
          showNumbers: true,
        }}
      />

      <ModalBody>
        {renderStep()}
      </ModalBody>

      {currentStep < 5 && (
        <ModalFooter
          leftLabel={currentStep > 1 ? "Anterior" : "Cancelar"}
          onLeftClick={currentStep > 1 ? goBack : onClose}
          rightLabel={currentStep === 4 ? "Continuar" : "Siguiente"}
          onRightClick={goNext}
          isSubmitting={false}
          submitDisabled={!canGoNext}
        />
      )}
    </ModalLayout>
  );
}
