import { useState, useCallback, useMemo, useEffect } from 'react';
import { Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

import { useFileParser } from './hooks/useFileParser';
import { useColumnAutoMap } from './hooks/useColumnAutoMap';
import { useValidationEngine } from './hooks/useValidationEngine';

import { StepPreview } from './steps/StepPreview';
import { StepMapping } from './steps/StepMapping';
import { StepValidation } from './steps/StepValidation';
import { StepConflicts } from './steps/StepConflicts';
import { StepSummary } from './steps/StepSummary';

import type { 
  ImportConfig, 
  ColumnMapping, 
  ManualMapping,
  IMPORT_STEPS 
} from './types';

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
  
  const [currentStep, setCurrentStep] = useState(1);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [manualMappings, setManualMappings] = useState<ManualMapping>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const { 
    parsedData, 
    isLoading: isParsingFile, 
    error: parseError, 
    parseFile, 
    reset: resetParser 
  } = useFileParser();

  const { 
    autoMapping, 
    unmappedHeaders, 
    unmappedFields,
    getSuggestions 
  } = useColumnAutoMap({
    headers: parsedData?.headers || [],
    targetSchema: config.targetSchema,
    customMapping: config.smartColumnMapping,
  });

  useEffect(() => {
    if (parsedData && Object.keys(columnMapping).length === 0 && Object.keys(autoMapping).length > 0) {
      setColumnMapping(autoMapping);
    }
  }, [parsedData, autoMapping, columnMapping]);

  const { 
    errors: validationErrors, 
    summary: validationSummary,
    isRowValid,
    getRowErrors 
  } = useValidationEngine({
    targetSchema: config.targetSchema,
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

    const foreignKeyFields = config.targetSchema.filter(f => f.type === 'foreign-key');

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

      uniqueValues.forEach(value => {
        const mappingKey = `${field.field}_${value}`;
        if (manualMappings[mappingKey] !== undefined) return;
        
        const normalized = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        
        let hasMatch = valueMapKeys.some(key => key === normalized);
        
        if (!hasMatch) {
          hasMatch = valueMapKeys.some(key => 
            key.includes(normalized) || normalized.includes(key)
          );
        }
        
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
              if (similarity > 0.6) {
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
  }, [parsedData, config, columnMapping, manualMappings]);

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
  }, []);

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
      case 2:
        return validationSummary.missingRequiredFields.length === 0;
      case 3:
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
  }, [currentStep, parsedData, validationSummary, conflicts, manualMappings]);

  const goNext = () => {
    if (currentStep < 5 && canGoNext) {
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
            targetSchema={config.targetSchema}
            columnMapping={columnMapping}
            onMappingChange={handleMappingChange}
            getSuggestions={getSuggestions}
          />
        ) : null;
      case 3:
        return (
          <StepValidation
            errors={validationErrors}
            summary={validationSummary}
            targetSchema={config.targetSchema}
          />
        );
      case 4:
        return (
          <StepConflicts
            conflicts={conflicts}
            manualMappings={manualMappings}
            onManualMappingChange={handleManualMappingChange}
            targetSchema={config.targetSchema}
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
