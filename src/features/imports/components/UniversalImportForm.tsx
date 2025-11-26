import { useState, useCallback, useMemo, useEffect } from 'react';
import { Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

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
  
  const [currentStep, setCurrentStep] = useState(1);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [manualMappings, setManualMappings] = useState<ManualMapping>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [aiConfidence, setAIConfidence] = useState<Record<string, number>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [contextOverrideToOrg, setContextOverrideToOrg] = useState(false);

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
            value = manualMappings[mappingKey] || null;
          }

          mappedRow[field] = value;
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
            // Clean up the client_name field as we've extracted _clientId
            delete mappedRow.client_name;
          }
        }

        mappedRows.push(mappedRow);
        setImportProgress(Math.round(((i + 1) / parsedData.rows.length) * 100));
      }

      await config.onImport(mappedRows);

      toast({
        title: "Importación exitosa",
        description: `Se importaron ${mappedRows.length} ${config.entityNamePlural} correctamente`,
      });

      onClose();
    } catch (error) {
      console.error('Import error:', error);
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

  const handleSwitchToOrgContext = useCallback(() => {
    setContextOverrideToOrg(true);
    // Re-trigger auto-mapping now that project_name field will be available
    setColumnMapping({});
  }, []);

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
          />
        ) : null;
      case 3:
        return (
          <StepValidation
            errors={validationErrors}
            summary={validationSummary}
            targetSchema={extendedSchema}
          />
        );
      case 4:
        return (
          <StepConflicts
            conflicts={conflicts}
            manualMappings={manualMappings}
            onManualMappingChange={handleManualMappingChange}
            targetSchema={extendedSchema}
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
