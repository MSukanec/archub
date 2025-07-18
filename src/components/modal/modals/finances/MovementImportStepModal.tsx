import React, { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Upload, FileText, AlertCircle, CheckCircle, X, RefreshCcw, ChevronRight } from 'lucide-react'
import { FormModalLayout, FormModalStepHeader, FormModalStepFooter } from '@/components/modal/form'
import { StepModalConfig, StepModalFooterConfig } from '@/components/modal/form/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrganizationMovementConcepts } from '@/hooks/use-organization-movement-concepts'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import UserSelector from '@/components/ui-custom/UserSelector'
import { cn } from '@/lib/utils'

// Value normalization utilities
const normalizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim()
    .replace(/\s+/g, ' '); // Normalize spaces
};

// Value mapping configurations
const createValueMap = (concepts: any[], currencies: any[], wallets: any[]) => {
  const valueMap: { [key: string]: { [key: string]: string } } = {};

  // Add type mappings with proper UUIDs (only from parent concepts)
  const types = concepts?.filter(c => !c.parent_id) || [];
  if (types?.length) {
    valueMap.type_id = {};
    types.forEach(type => {
      const normalized = normalizeText(type.name);
      valueMap.type_id[normalized] = type.id;
      
      // Add common variations for types
      const typeVariations = [
        type.name.toLowerCase(),
        type.name.replace(/\s+/g, ''),
        // Specific type mappings
        ...(type.name.toLowerCase().includes('ingreso') ? ['ingreso', 'ingresos', 'entrada', 'cobro'] : []),
        ...(type.name.toLowerCase().includes('egreso') ? ['egreso', 'egresos', 'salida', 'gasto', 'pago'] : []),
        ...(type.name.toLowerCase().includes('conversion') ? ['conversion', 'cambio', 'intercambio'] : []),
        ...(type.name.toLowerCase().includes('transferencia') ? ['transferencia', 'transfer', 'traslado'] : [])
      ];
      
      typeVariations.forEach(variation => {
        const varNormalized = normalizeText(variation);
        if (varNormalized !== normalized && varNormalized.length > 2) {
          valueMap.type_id[varNormalized] = type.id;
        }
      });
    });
    
    console.log('🔧 Type mappings created:', {
      typesFound: types.length,
      typeNames: types.map(t => t.name),
      mappingKeys: Object.keys(valueMap.type_id).slice(0, 10)
    });
  }

  // Add currency mappings
  if (currencies?.length) {
    valueMap.currency_id = {};
    currencies.forEach(orgCurrency => {
      const currency = orgCurrency.currency || orgCurrency;
      const normalized = normalizeText(currency.name);
      valueMap.currency_id[normalized] = orgCurrency.id; // Use organization_currency.id instead of currency.id
      if (currency.code) {
        valueMap.currency_id[normalizeText(currency.code)] = orgCurrency.id; // Use organization_currency.id instead of currency.id
      }
    });
  }

  // Add wallet mappings
  if (wallets?.length) {
    valueMap.wallet_id = {};
    wallets.forEach(orgWallet => {
      const wallet = orgWallet.wallets || orgWallet;
      const normalized = normalizeText(wallet.name);
      valueMap.wallet_id[normalized] = orgWallet.id; // Use organization_wallet.id instead of wallet.id
    });
  }

  // Extract categories (intermediate level: children of types, parents of subcategories)
  const allCategories = types?.flatMap(type => type.children || []) || [];
  console.log('🔧 Categories for mapping:', {
    typesFound: types.length,
    categoriesFound: allCategories.length,
    categoryNames: allCategories.map(c => c.name).slice(0, 5)
  });

  // Add category mappings (intermediate level)
  if (allCategories?.length) {
    valueMap.category_id = {};
    allCategories.forEach(category => {
      const normalized = normalizeText(category.name);
      valueMap.category_id[normalized] = category.id;
      
      // Add common variations for better fuzzy matching
      const variations = [
        category.name.toLowerCase(),
        category.name.replace(/\s+/g, ''), // Remove spaces: "Mano de Obra" -> "manodeobra"
        category.name.replace(/[^a-zA-Z0-9]/g, ''), // Remove special chars
        category.name.replace(/\s+/g, '').toLowerCase(), // Combined
        category.name.replace(/de|del|la|el|y|e/gi, '').replace(/\s+/g, ''), // Remove common words
      ];
      
      variations.forEach(variation => {
        const varNormalized = normalizeText(variation);
        if (varNormalized !== normalized && varNormalized.length > 2) {
          valueMap.category_id[varNormalized] = category.id;
        }
      });
    });
  }

  // Extract subcategories (children of categories)
  const allSubcategories = allCategories?.flatMap(category => category.children || []) || [];
  console.log('🔧 Subcategories for mapping:', {
    categoriesFound: allCategories.length,
    subcategoriesFound: allSubcategories.length,
    subcategoryNames: allSubcategories.map(s => s.name).slice(0, 5)
  });

  // Add subcategory mappings (deepest level)
  if (allSubcategories?.length) {
    valueMap.subcategory_id = {};
    allSubcategories.forEach(subcategory => {
      const normalized = normalizeText(subcategory.name);
      valueMap.subcategory_id[normalized] = subcategory.id;
      
      // Add common variations for better fuzzy matching
      const variations = [
        subcategory.name.toLowerCase(),
        subcategory.name.replace(/\s+/g, ''), // Remove spaces: "Mano de Obra" -> "manodeobra"
        subcategory.name.replace(/[^a-zA-Z0-9]/g, ''), // Remove special chars
        subcategory.name.replace(/\s+/g, '').toLowerCase(), // Combined
        subcategory.name.replace(/de|del|la|el|y|e/gi, '').replace(/\s+/g, ''), // Remove common words
      ];
      
      variations.forEach(variation => {
        const varNormalized = normalizeText(variation);
        if (varNormalized !== normalized && varNormalized.length > 2) {
          valueMap.subcategory_id[varNormalized] = subcategory.id;
        }
      });
    });
  }

  return valueMap;
};

// UUID validation helper
const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

const normalizeValue = (field: string, value: any, valueMap: any, manualMappings: any = {}): any => {
  if (!value || value === '' || value === 'Sin asignar' || value === 'empty-placeholder') {
    return null;
  }
  
  const stringValue = String(value).trim();
  const normalized = normalizeText(stringValue);
  
  // Debug logging for UUID fields
  if (['type_id', 'category_id', 'subcategory_id'].includes(field)) {
    console.log(`🔍 Processing ${field}:`, {
      originalValue: value,
      stringValue,
      normalized,
      valueMapForField: valueMap[field],
      directMatch: valueMap[field] && valueMap[field][normalized]
    });
  }
  
  // Check manual mappings first
  const mappingKey = `${field}_${stringValue}`;
  if (manualMappings[mappingKey] !== undefined) {
    // Return null for empty string mappings (Sin asignar)
    return manualMappings[mappingKey] === '' || manualMappings[mappingKey] === 'empty-placeholder' ? null : manualMappings[mappingKey];
  }
  
  // Check direct mapping
  if (valueMap[field] && valueMap[field][normalized]) {
    if (['type_id', 'category_id', 'subcategory_id'].includes(field)) {
      console.log(`✅ ${field} direct match found:`, valueMap[field][normalized]);
    }
    return valueMap[field][normalized];
  }
  
  // Try fuzzy matching for field mappings
  if (valueMap[field]) {
    const fieldMap = valueMap[field];
    
    // First try exact matches and substring matches
    for (const [key, mappedValue] of Object.entries(fieldMap)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return mappedValue;
      }
    }
    
    // Then try similarity matching with lower threshold for better matching
    let bestMatch = null;
    let bestSimilarity = 0;
    
    for (const [key, mappedValue] of Object.entries(fieldMap)) {
      if (key.length > 3 && normalized.length > 3) {
        const similarity = calculateSimilarity(normalized, key);
        if (similarity > bestSimilarity && similarity > 0.6) { // Lowered to 60%
          bestSimilarity = similarity;
          bestMatch = mappedValue;
        }
      }
    }
    
    if (bestMatch) {
      if (['type_id', 'subcategory_id'].includes(field)) {
        console.log(`✅ ${field} fuzzy match found:`, bestMatch);
      }
      return bestMatch;
    }
  }
  
  // CRITICAL: For UUID fields, never return non-UUID values
  // This prevents database constraint errors
  if (['type_id', 'subcategory_id', 'currency_id', 'wallet_id'].includes(field)) {
    if (!isValidUUID(stringValue)) {
      console.warn(`⚠️ ${field} could not be mapped to UUID for value:`, stringValue);
      return null; // This will force it to appear in step 3 as incompatible
    }
  }
  
  // Return null for unmappable values to avoid UUID errors
  return null;
};

// Simple similarity calculation for fuzzy matching
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

interface MovementImportStepModalProps {
  modalData?: any
  onClose: () => void
}

interface ParsedData {
  headers: string[]
  rows: any[][]
  fileName: string
}

interface ColumnMapping {
  [columnIndex: string]: string
}

interface ValidationError {
  row: number
  column: string
  message: string
}

const AVAILABLE_FIELDS = [
  { value: 'movement_date', label: 'Fecha' },
  { value: 'description', label: 'Descripción' },
  { value: 'amount', label: 'Cantidad' },
  { value: 'currency_id', label: 'Moneda' },
  { value: 'wallet_id', label: 'Billetera' },
  { value: 'type_id', label: 'Tipo' },
  { value: 'category_id', label: 'Categoría' },
  { value: 'subcategory_id', label: 'Subcategoría' },
  { value: 'exchange_rate', label: 'Cotización' }
]

// Smart column mapping - maps Excel headers to field values
const SMART_COLUMN_MAPPING: { [key: string]: string } = {
  'descripcion': 'description',
  'descripción': 'description',
  'concepto': 'description',
  'detalle': 'description',
  'cantidad': 'amount',
  'monto': 'amount',
  'importe': 'amount',
  'total': 'amount',
  'valor': 'amount',
  'fecha': 'movement_date',
  'date': 'movement_date',
  'tipo': 'type_id',
  'type': 'type_id',
  'categoria': 'subcategory_id',
  'categoría': 'subcategory_id',
  'subcategoria': 'subcategory_id',
  'subcategoría': 'subcategory_id',
  'moneda': 'currency_id',
  'currency': 'currency_id',
  'fiat': 'currency_id',
  'billetera': 'wallet_id',
  'wallet': 'wallet_id',
  'cuenta': 'wallet_id',
  'cotizacion': 'exchange_rate',
  'cotización': 'exchange_rate',
  'tasa': 'exchange_rate',
  'rate': 'exchange_rate'
}

export default function MovementImportStepModal({ modalData, onClose }: MovementImportStepModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [dropzoneKey, setDropzoneKey] = useState(0)
  const [selectedCreator, setSelectedCreator] = useState<string>('')
  const [manualMappings, setManualMappings] = useState<{[key: string]: string}>({})
  const [incompatibleValues, setIncompatibleValues] = useState<{ [key: string]: string[] }>({})
  // Force re-render counter for the problematic selectors
  const [renderCounter, setRenderCounter] = useState(0)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Data hooks
  const { data: currentUser } = useCurrentUser()
  const organizationId = currentUser?.organization?.id
  const { data: movementConcepts } = useOrganizationMovementConcepts(organizationId)
  const { data: organizationCurrencies } = useOrganizationCurrencies(organizationId)
  const { data: organizationWallets } = useOrganizationWallets(organizationId)
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId)
  
  // Convert members to users format for UserSelector
  const users = organizationMembers.map(member => ({
    id: member.user_id,
    full_name: member.full_name || member.email || 'Usuario',
    email: member.email || '',
    avatar_url: member.avatar_url
  }))
  
  // Set default creator when data loads
  React.useEffect(() => {
    if (!selectedCreator && currentUser?.user?.id) {
      setSelectedCreator(currentUser.user.id)
    }
  }, [currentUser?.user?.id, selectedCreator])

  // Auto-map columns based on header names when data is parsed
  React.useEffect(() => {
    if (parsedData && parsedData.headers && Object.keys(columnMapping).length === 0) {
      const autoMapping: ColumnMapping = {}
      
      parsedData.headers.forEach((header, index) => {
        const normalizedHeader = normalizeText(header)
        const mappedField = SMART_COLUMN_MAPPING[normalizedHeader]
        
        if (mappedField) {
          autoMapping[index] = mappedField
          console.log(`🎯 Auto-mapped "${header}" to "${mappedField}"`)
        }
      })
      
      if (Object.keys(autoMapping).length > 0) {
        setColumnMapping(autoMapping)
        console.log('🚀 Auto-mapping applied:', autoMapping)
      }
    }
  }, [parsedData, columnMapping])

  // Filtrar conceptos por tipo
  const types = movementConcepts?.filter(c => !c.parent_id) || []
  // Get ALL concepts with parent_id (subcategories) - flatten the structure
  const categories = movementConcepts?.flatMap(concept => concept.children || []) || []
  

  
  // Create value mapping for normalization
  const valueMap = createValueMap(movementConcepts || [], organizationCurrencies || [], organizationWallets || [])
  
  // Debug valueMap construction
  console.log('🔧 ValueMap constructed:', {
    type_id: Object.keys(valueMap.type_id || {}).length,
    subcategory_id: Object.keys(valueMap.subcategory_id || {}).length,
    currency_id: Object.keys(valueMap.currency_id || {}).length,
    wallet_id: Object.keys(valueMap.wallet_id || {}).length,
    subcategory_sample: Object.keys(valueMap.subcategory_id || {}).slice(0, 5),
    concepts_received: movementConcepts?.length || 0
  })

  // Reset modal state
  const resetModal = () => {
    setCurrentStep(1)
    setParsedData(null)
    setColumnMapping({})
    setValidationErrors([])
    setIsProcessing(false)
    setSelectedRows(new Set())
    setDropzoneKey(prev => prev + 1)
    setManualMappings({})
  }

  // File processing
  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true)
    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      
      if (isExcel) {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const worksheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[worksheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length > 0) {
          const headers = jsonData[0] as string[]
          const rows = jsonData.slice(1) as any[][]
          
          const validHeaders = headers
            .map((h, index) => ({ header: h, index }))
            .filter(({ header }) => header && header.toString().trim())
            .map(({ header }) => header.toString().trim())
          
          if (validHeaders.length === 0) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "No se encontraron columnas válidas en el archivo."
            })
            return
          }
          
          setParsedData({
            headers: validHeaders,
            rows: rows,
            fileName: file.name
          })
        }
      } else {
        // CSV processing
        Papa.parse(file, {
          complete: (results) => {
            if (results.data.length > 0) {
              const headers = results.data[0] as string[]
              const rows = results.data.slice(1) as any[][]
              
              const validHeaders = headers.filter(h => h && h.trim())
              
              if (validHeaders.length === 0) {
                toast({
                  variant: "destructive",
                  title: "Error", 
                  description: "No se encontraron columnas válidas en el archivo."
                })
                return
              }
              
              setParsedData({
                headers: validHeaders,
                rows: rows,
                fileName: file.name
              })
            }
          },
          header: false,
          skipEmptyLines: true
        })
      }
    } catch (error) {
      console.error('Error processing file:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al procesar el archivo. Verifica que sea un formato válido."
      })
    } finally {
      setIsProcessing(false)
    }
  }, [toast])

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    key: dropzoneKey,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0])
      }
    },
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false
  })

  // Validation
  const validateMapping = () => {
    const errors: ValidationError[] = []
    const mappedFields = Object.values(columnMapping).filter(field => field !== '')
    const duplicates = mappedFields.filter((field, index) => mappedFields.indexOf(field) !== index)
    
    if (duplicates.length > 0) {
      errors.push({
        row: 0,
        column: 'mapping',
        message: `Campos duplicados: ${duplicates.join(', ')}`
      })
    }
    
    if (mappedFields.length === 0) {
      errors.push({
        row: 0,
        column: 'mapping',
        message: 'Debes mapear al menos una columna'
      })
    }
    
    // Check if there are any unmapped values that need manual mapping
    const hasUnmappedValues = Object.keys(columnMapping).some(columnIndex => {
      const mappedField = columnMapping[columnIndex]
      if (!mappedField || !parsedData?.rows) return false
      
      const sampleValue = parsedData.rows[0]?.[parseInt(columnIndex)]
      if (!sampleValue) return false
      
      const validation = validateFieldValue(mappedField, sampleValue)
      return !validation.isValid && validation.available && validation.available.length > 0
    })
    
    if (hasUnmappedValues) {
      errors.push({
        row: 0,
        column: 'mapping',
        message: 'Hay valores que requieren mapeo manual. Revisa las secciones marcadas con "🔧 REVISAR MAPEO" y haz clic en los valores disponibles.'
      })
    }
    
    setValidationErrors(errors)
    
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: `${errors.length} error(es) encontrado(s). Revisa el mapeo.`
      })
    }
    
    return errors.length === 0
  }

  // Función para analizar valores incompatibles
  const analyzeIncompatibleValues = () => {
    const incompatible: { [key: string]: string[] } = {}
    
    if (!parsedData) return incompatible
    
    // Analizar cada fila del archivo
    parsedData.rows.forEach(row => {
      Object.entries(columnMapping).forEach(([columnIndex, fieldName]) => {
        if (['type_id', 'category_id', 'currency_id', 'wallet_id', 'subcategory_id'].includes(fieldName)) {
          const value = row[parseInt(columnIndex)]
          if (value) {
            const validation = validateFieldValue(fieldName, value)
            if (!validation.isValid) {
              if (!incompatible[fieldName]) {
                incompatible[fieldName] = []
              }
              if (!incompatible[fieldName].includes(value)) {
                incompatible[fieldName].push(value)
              }
            }
          }
        }
      })
    })
    
    return incompatible
  }

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (movements: any[]) => {
      try {
        // Clean and validate movements data before sending
        const cleanedMovements = movements.map(movement => {
          const cleaned: any = {}
          
          // Only include defined and non-empty values
          Object.entries(movement).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              cleaned[key] = value
            }
          })
          
          return cleaned
        })

        const response = await fetch('/api/movements/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movements: cleanedMovements })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Error ${response.status}: ${errorText}`)
        }
        
        return response.json()
      } catch (error) {
        console.error('Import mutation error:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      toast({
        title: "Éxito",
        description: `${selectedRows.size > 0 ? selectedRows.size : parsedData?.rows.length || 0} movimientos importados correctamente.`
      })
      onClose()
    },
    onError: (error) => {
      console.error('Import error:', error)
      const errorMessage = error?.message || "Error al importar los movimientos."
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
    }
  })

  // Handle import
  const handleImport = async () => {
    if (!parsedData || !currentUser?.organization?.id) return
    
    // Find the correct organization_member.id based on the selected creator user_id
    const selectedMember = organizationMembers.find(member => member.user_id === selectedCreator)
    if (!selectedMember) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo encontrar el miembro de la organización para el creador seleccionado."
      })
      return
    }
    
    console.log('Selected creator user_id:', selectedCreator)
    console.log('Found organization member:', selectedMember)
    console.log('ValueMap created:', valueMap)
    
    const selectedRowsArray = Array.from(selectedRows)
    const rowsToProcess = selectedRowsArray.length > 0 
      ? selectedRowsArray.map(index => parsedData.rows[index])
      : parsedData.rows

    const processedMovements = rowsToProcess
      .map((row) => {
        const movement: any = {
          description: 'Movimiento importado',
          amount: 0,
          movement_date: new Date().toISOString().split('T')[0],
          organization_id: currentUser.organization.id,
          project_id: modalData?.projectId || currentUser.preferences?.last_project_id,
          created_by: selectedMember.id, // Use organization_member.id instead of user.id
          is_favorite: false
        }

        let hasValidData = false

        // Map columns to movement fields
        Object.entries(columnMapping).forEach(([columnIndex, fieldName]) => {
          if (fieldName && row[parseInt(columnIndex)] !== undefined) {
            const value = row[parseInt(columnIndex)]
            
            switch (fieldName) {
              case 'movement_date':
                if (typeof value === 'number') {
                  // Handle Excel date serial numbers
                  const excelEpoch = new Date(1900, 0, 1)
                  const jsDate = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000)
                  movement.movement_date = jsDate.toISOString().split('T')[0]
                  hasValidData = true
                  console.log(`Converted Excel date ${value} to ${movement.movement_date}`)
                } else if (value && typeof value === 'string') {
                  // Handle string dates
                  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
                  if (dateRegex.test(value)) {
                    movement.movement_date = value
                    hasValidData = true
                  } else {
                    // Try to parse other date formats
                    const parsedDate = new Date(value)
                    if (!isNaN(parsedDate.getTime())) {
                      movement.movement_date = parsedDate.toISOString().split('T')[0]
                      hasValidData = true
                    }
                  }
                }
                break
              case 'amount':
                const parsedAmount = parseFloat(value)
                if (!isNaN(parsedAmount)) {
                  movement.amount = parsedAmount
                  hasValidData = true
                }
                break
              case 'exchange_rate':
                const parsedRate = parseFloat(value)
                if (!isNaN(parsedRate)) {
                  movement.exchange_rate = parsedRate
                }
                break
              case 'description':
                if (value && String(value).trim()) {
                  movement.description = String(value).trim()
                  hasValidData = true
                }
                break
              default:
                // Apply value normalization for specific fields
                if (['type_id', 'category_id', 'currency_id', 'wallet_id', 'subcategory_id'].includes(fieldName)) {
                  const normalizedValue = normalizeValue(fieldName, value, valueMap, manualMappings)
                  
                  // ONLY set the field if we got a valid UUID
                  if (normalizedValue && typeof normalizedValue === 'string' && isValidUUID(normalizedValue)) {
                    movement[fieldName] = normalizedValue
                    hasValidData = true
                    console.log(`✅ ${fieldName} mapped successfully: ${value} → ${normalizedValue}`)
                  } else {
                    console.warn(`⚠️ ${fieldName} SKIPPED - no valid mapping for: "${value}"`)
                    // CRITICAL: Never set non-UUID values - they should appear in step 3
                  }
                } else if (value) {
                  movement[fieldName] = value
                  hasValidData = true
                }
            }
          }
        })

        // Only return movement if it has valid mappable data
        return hasValidData ? movement : null
      })
      .filter(Boolean) // Remove null movements

    // Log detailed info about what's being sent
    console.log(`Enviando ${processedMovements.length} movimientos válidos al servidor`);
    console.log('Primer movimiento procesado:', processedMovements[0]);
    
    // Check for any remaining text values in UUID fields
    const badMovements = processedMovements.filter(m => 
      (m.type_id && typeof m.type_id === 'string' && !m.type_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) ||
      (m.currency_id && typeof m.currency_id === 'string' && !m.currency_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) ||
      (m.wallet_id && typeof m.wallet_id === 'string' && !m.wallet_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) ||
      (m.subcategory_id && typeof m.subcategory_id === 'string' && !m.subcategory_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
    );
    
    if (badMovements.length > 0) {
      console.log('Movimientos con valores no UUID encontrados:', badMovements);
      toast({
        variant: "destructive",
        title: "Error de mapeo",
        description: `${badMovements.length} movimientos tienen valores no mapeados que causan errores. Revisa el mapeo en el paso 2.`
      });
      return;
    }
    
    importMutation.mutate(processedMovements)
  }

  // Step configurations
  const stepConfig: StepModalConfig = {
    currentStep,
    totalSteps: 3,
    stepTitle: currentStep === 1 ? 'Seleccionar archivo y creador' : 
               currentStep === 2 ? 'Mapear columnas' : 
               'Resolver valores incompatibles e importar'
  }

  const getFooterConfig = (): StepModalFooterConfig => {
    const baseCancel = {
      label: 'Cancelar',
      onClick: onClose
    }

    switch (currentStep) {
      case 1:
        return {
          cancelAction: baseCancel,
          nextAction: {
            label: 'Siguiente',
            onClick: () => setCurrentStep(2),
            disabled: !parsedData || !selectedCreator
          }
        }
      case 2:
        return {
          cancelAction: baseCancel,
          previousAction: {
            label: 'Anterior',
            onClick: () => {
              setCurrentStep(1)
              setParsedData(null)
              setColumnMapping({})
              setManualMappings({})
            }
          },
          nextAction: {
            label: 'Siguiente',
            onClick: () => {
              // Analizar valores incompatibles
              const incompatible = analyzeIncompatibleValues()
              setIncompatibleValues(incompatible)
              setCurrentStep(3)
            },
            disabled: Object.keys(columnMapping).length === 0
          }
        }
      case 3:
        return {
          cancelAction: baseCancel,
          previousAction: {
            label: 'Anterior',
            onClick: () => setCurrentStep(2)
          },
          submitAction: {
            label: 'Importar',
            onClick: handleImport,
            disabled: !parsedData || importMutation.isPending,
            loading: importMutation.isPending
          }
        }
      default:
        return { cancelAction: baseCancel }
    }
  }

  // Step content renderers
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Creador de los movimientos</Label>
        <UserSelector
          users={users}
          value={selectedCreator}
          onChange={setSelectedCreator}
          placeholder="Seleccionar miembro de la organización"
        />
      </div>

      <div className="space-y-3">
        <Label>Archivo de movimientos</Label>
        {!parsedData && (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-blue-400 bg-blue-50 dark:bg-blue-950" : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
          >
            <input {...getInputProps()} />
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium">Haz clic o arrastra un archivo</p>
            <p className="text-xs text-muted-foreground mt-1">
              Formatos soportados: .xlsx, .xls, .csv
            </p>
          </div>
        )}

        {parsedData && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Archivo cargado: {parsedData.fileName} ({parsedData.rows.length} filas)
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Alert className="border-amber-200 bg-amber-50 text-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription>
          El archivo debe tener una fila de encabezados en la primera línea
        </AlertDescription>
      </Alert>

      {isProcessing && (
        <div className="flex items-center justify-center py-4">
          <RefreshCcw className="h-5 w-5 animate-spin mr-2" />
          <span>Procesando archivo...</span>
        </div>
      )}
    </div>
  )



  // Validation function for field values
  const validateFieldValue = (fieldName: string, value: any) => {
    if (!value) return { isValid: true, suggestion: null }

    const normalizedValue = normalizeText(String(value))
    
    switch (fieldName) {
      case 'type_id':
        const normalizedVal = normalizeValue(fieldName, value, valueMap, manualMappings)
        // Check if it's a direct UUID match with types table
        const typeMatch = types.find(t => t.id === normalizedVal)
        const isDirectTypeMatch = !!typeMatch
        
        console.log('🔍 Validating type_id:', {
          originalValue: value,
          normalizedVal,
          isDirectTypeMatch,
          typeMatch: typeMatch?.name,
          allTypes: types.map(t => ({ id: t.id, name: t.name }))
        });
        
        return { 
          isValid: isDirectTypeMatch, 
          suggestion: typeMatch?.name,
          available: types.map(t => t.name),
          mappedValue: normalizedVal
        }
      case 'currency_id':
        const currencyNormalized = normalizeValue(fieldName, value, valueMap, manualMappings)
        // Check if it's a direct UUID match with organization currencies
        const currencyMatch = organizationCurrencies?.find(c => c.currency.id === currencyNormalized)
        const isDirectCurrencyMatch = !!currencyMatch
        return { 
          isValid: isDirectCurrencyMatch, 
          suggestion: currencyMatch?.currency?.name,
          available: organizationCurrencies?.map(c => c.currency.name) || [],
          mappedValue: currencyNormalized
        }
      case 'wallet_id':
        const walletNormalized = normalizeValue(fieldName, value, valueMap, manualMappings)
        // Check if it's a direct UUID match with organization wallets
        const walletMatch = organizationWallets?.find(w => w.wallets.id === walletNormalized)
        const isDirectWalletMatch = !!walletMatch
        return { 
          isValid: isDirectWalletMatch, 
          suggestion: walletMatch?.wallets?.name,
          available: organizationWallets?.map(w => w.wallets.name) || [],
          mappedValue: walletNormalized
        }
      case 'subcategory_id':
        const subcategoryNormalized = normalizeValue(fieldName, value, valueMap, manualMappings)
        // Check if it's a direct UUID match with categories table
        const subcategoryMatch = categories.find(c => c.id === subcategoryNormalized)
        const isDirectSubcategoryMatch = !!subcategoryMatch

        console.log('🔍 Validating subcategory_id:', {
          originalValue: value,
          subcategoryNormalized,
          isDirectSubcategoryMatch,
          subcategoryMatch: subcategoryMatch?.name
        });

        return { 
          isValid: isDirectSubcategoryMatch, 
          suggestion: subcategoryMatch?.name,
          available: categories.map(c => c.name),
          mappedValue: subcategoryNormalized
        }
      default:
        return { isValid: true, suggestion: null }
    }
  }

  // Helper function to get available options for each field type
  const getAvailableOptionsForField = (fieldName: string) => {
    let options = []
    switch (fieldName) {
      case 'type_id':
        options = types.map(t => ({ id: t.id, name: t.name }))
        break
      case 'currency_id':
        options = (organizationCurrencies || []).map(c => ({ id: c.currency.id, name: c.currency.name }))
        break
      case 'wallet_id':
        options = (organizationWallets || []).map(w => ({ id: w.wallets.id, name: w.wallets.name }))
        break
      case 'subcategory_id':
        options = categories.map(c => ({ id: c.id, name: c.name }))
        break
      default:
        options = []
    }
    
    console.log(`🎯 Options for ${fieldName}:`, { 
      fieldName, 
      count: options.length, 
      options: options.slice(0, 3),
      types: types.length,
      categories: categories.length,
      currencies: organizationCurrencies?.length || 0,
      wallets: organizationWallets?.length || 0
    })
    
    return options
  }

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Mapear columnas del archivo</h3>
        <p className="text-sm text-muted-foreground">
          Asigna cada columna del Excel a un campo de movimiento. El sistema detecta automáticamente los mapeos más probables.
        </p>
      </div>

      {parsedData && (
        <div className="space-y-4">
          {parsedData.headers.map((header, index) => {
            const mappedField = columnMapping[index]
            const sampleValue = parsedData.rows[0]?.[index]
            
            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 text-center">
                      <Badge variant="outline" className="text-xs font-mono w-8 h-6">{String.fromCharCode(65 + index)}</Badge>
                    </div>
                    <div className="col-span-4">
                      <div className="font-medium text-sm">{header}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Ejemplo: {sampleValue && <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{sampleValue}</span>}
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="col-span-4">
                      <Select 
                        value={columnMapping[index] || ''} 
                        onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [index]: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Seleccionar campo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No mapear</SelectItem>
                          {AVAILABLE_FIELDS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 text-right">
                      {mappedField && (
                        <Badge variant="default" className="bg-green-100 text-green-800 text-xs border-green-200">
                          ✓ Mapeado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderStep3 = () => {
    if (Object.keys(incompatibleValues).length === 0) {
      return (
        <div className="space-y-6">
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">¡Todos los valores son compatibles!</h3>
            <p className="text-sm text-muted-foreground">
              No se encontraron valores que requieran mapeo manual. Puedes continuar a la vista previa.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Resolver valores incompatibles</h3>
          <p className="text-sm text-muted-foreground">
            Los siguientes valores de tu archivo no coinciden con los datos existentes en Archub. Mapéalos manualmente o déjalos sin asignar.
          </p>
        </div>

        <div className="space-y-6">
          {Object.entries(incompatibleValues).map(([fieldName, values]) => {
            const fieldLabel = AVAILABLE_FIELDS.find(f => f.value === fieldName)?.label || fieldName
            return (
              <Card key={fieldName}>
                <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Campo: {fieldLabel}</h4>
                    <p className="text-xs text-muted-foreground">
                      {values.length} valor(es) incompatible(s) encontrado(s)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const fieldMappings: { [key: string]: string } = {};
                      values.forEach(value => {
                        fieldMappings[`${fieldName}_${value}`] = '';
                      });
                      setManualMappings(prev => {
                        const newMappings = {
                          ...prev,
                          ...fieldMappings
                        };
                        // Force re-render by incrementing render counter
                        setTimeout(() => {
                          setRenderCounter(prev => prev + 1);
                          setManualMappings({ ...newMappings });
                        }, 10);
                        return newMappings;
                      });
                      toast({
                        title: "Campo completado",
                        description: `Todos los valores de "${fieldLabel}" se asignaron como NULL`
                      });
                    }}
                  >
                    PONER TODO NULL
                  </Button>
                </div>

                <div className="space-y-4">
                  {values.map((value, index) => {
                    const mappingKey = `${fieldName}_${value}`
                    const validation = validateFieldValue(fieldName, value)
                    
                    return (
                      <div key={index} className="grid grid-cols-12 gap-4 items-center p-3 bg-gray-50 rounded">
                        <div className="col-span-4">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            <span className="font-mono text-sm">{value}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Valor de tu archivo
                          </p>
                        </div>
                        
                        <div className="col-span-1 text-center">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        
                        <div className="col-span-5">
                          <Select 
                            key={`${mappingKey}-${manualMappings[mappingKey] || 'empty'}-${renderCounter}`}
                            value={manualMappings[mappingKey] || ''}
                            onValueChange={(selectedId) => {
                              setManualMappings(prev => ({
                                ...prev,
                                [mappingKey]: selectedId
                              }));
                              
                              // Find the name for the toast
                              let selectedName = '';
                              if (fieldName === 'type_id') {
                                selectedName = types.find(t => t.id === selectedId)?.name || '';
                              } else if (fieldName === 'currency_id') {
                                selectedName = organizationCurrencies?.find(c => c.currency.id === selectedId)?.currency?.name || '';
                              } else if (fieldName === 'wallet_id') {
                                selectedName = organizationWallets?.find(w => w.wallets.id === selectedId)?.wallets?.name || '';
                              } else if (fieldName === 'subcategory_id') {
                                selectedName = categories.find(c => c.id === selectedId)?.name || '';
                              }
                              
                              toast({
                                title: "Mapeo aplicado",
                                description: `"${value}" → "${selectedName}"`
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar valor o dejar sin asignar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Sin asignar (NULL)</SelectItem>
                              {getAvailableOptionsForField(fieldName).map((option, idx) => (
                                <SelectItem key={idx} value={option.id}>
                                  {option.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="col-span-2">
                          {manualMappings[mappingKey] ? (
                            <div className="flex items-center gap-1 text-green-700 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              <span>Mapeado</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin mapear</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Los valores sin mapear se importarán como NULL en la base de datos. 
            Esto significa que esos campos estarán vacíos y podrás completarlos manualmente después de la importación.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const renderStep4 = () => {
    // Check for normalized values to show preview
    const normalizedValues = new Set<string>()
    
    if (parsedData) {
      parsedData.rows.slice(0, 10).forEach((row) => {
        Object.entries(columnMapping).forEach(([columnIndex, fieldName]) => {
          if (['type_id', 'currency_id', 'wallet_id', 'subcategory_id'].includes(fieldName)) {
            const value = row[parseInt(columnIndex)]
            if (value) {
              const normalizedValue = normalizeValue(fieldName, value, valueMap)
              if (normalizedValue !== value) {
                normalizedValues.add(`${fieldName}: "${value}" → "${normalizedValue}"`)
              }
            }
          }
        })
      })
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Vista previa</h3>
          <p className="text-sm text-muted-foreground">
            Revisa los datos antes de importar. Puedes seleccionar filas específicas.
          </p>
        </div>

        {normalizedValues.size > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Valores normalizados automáticamente:</div>
              <div className="text-xs space-y-1">
                {Array.from(normalizedValues).slice(0, 5).map((mapping, index) => (
                  <div key={index} className="text-muted-foreground">{mapping}</div>
                ))}
                {normalizedValues.size > 5 && (
                  <div className="text-muted-foreground">...y {normalizedValues.size - 5} más</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

      {parsedData && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Badge variant="outline">
              {parsedData.rows.length} filas encontradas
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedRows.size === parsedData.rows.length) {
                  setSelectedRows(new Set())
                } else {
                  setSelectedRows(new Set(Array.from({ length: parsedData.rows.length }, (_, i) => i)))
                }
              }}
            >
              {selectedRows.size === parsedData.rows.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRows.size === parsedData.rows.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRows(new Set(Array.from({ length: parsedData.rows.length }, (_, i) => i)))
                        } else {
                          setSelectedRows(new Set())
                        }
                      }}
                    />
                  </TableHead>
                  {parsedData.headers.map((header, index) => (
                    <TableHead key={index}>
                      {header}
                      {columnMapping[index.toString()] && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {AVAILABLE_FIELDS.find(f => f.value === columnMapping[index.toString()])?.label}
                        </Badge>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.rows.slice(0, 10).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(rowIndex)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedRows)
                          if (checked) {
                            newSelected.add(rowIndex)
                          } else {
                            newSelected.delete(rowIndex)
                          }
                          setSelectedRows(newSelected)
                        }}
                      />
                    </TableCell>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="max-w-32 truncate">
                        {cell?.toString() || ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {parsedData.rows.length > 10 && (
            <p className="text-xs text-muted-foreground text-center">
              Mostrando las primeras 10 filas de {parsedData.rows.length}
            </p>
          )}

          {selectedRows.size > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Se importarán {selectedRows.size} filas seleccionadas
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
    )
  }

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      default:
        return renderStep1()
    }
  }

  const headerContent = (
    <FormModalStepHeader
      title="Importar Movimientos"
      icon={Upload}
      stepConfig={stepConfig}
    />
  )

  const footerContent = (
    <FormModalStepFooter
      config={getFooterConfig()}
    />
  )

  return (
    <FormModalLayout
      headerContent={headerContent}
      footerContent={footerContent}
      stepContent={getCurrentStepContent()}
      onClose={onClose}
      columns={1}
      className="md:min-w-[800px] md:max-w-[1000px]"
    />
  )
}