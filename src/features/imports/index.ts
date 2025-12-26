export { UniversalImportForm } from './components/UniversalImportForm';

export {
  type FieldType,
  type TargetField,
  type ImportConfig,
  type ParsedData,
  type ColumnMapping,
  type ValidationError,
  type ConflictItem,
  type ManualMapping,
  type ImportStep,
  type ImportState,
  IMPORT_STEPS,
} from './types';

export {
  useFileParser,
  useColumnAutoMap,
  useValidationEngine,
  useValueNormalizer,
} from './hooks';

export {
  StepPreview,
  StepMapping,
  StepValidation,
  StepConflicts,
  StepSummary,
} from './steps';

export {
  normalizeText,
  levenshteinDistance,
  calculateSimilarity,
  isValidUUID,
  parseDate,
  parseNumber,
  parseCurrency,
} from './utils';

export {
  getMappingPatterns,
  getAllMappingPatterns,
  saveMappingPattern,
  saveMappingPatternsBatch,
  deleteMappingPattern,
} from './services';
