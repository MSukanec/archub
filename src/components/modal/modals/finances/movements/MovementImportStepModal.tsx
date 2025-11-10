import React, { useState, useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Upload, FileText, AlertCircle, CheckCircle, X, RefreshCcw, ChevronRight, ArrowRight, Plus } from 'lucide-react'
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
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { useOrganizationMovementConcepts } from '@/hooks/use-organization-movement-concepts'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useToast } from '@/hooks/use-toast'
import UserSelectorField from '@/components/ui-custom/fields/UserSelectorField'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

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
  

  
  // Check manual mappings first
  const mappingKey = `${field}_${stringValue}`;
  if (manualMappings[mappingKey] !== undefined) {
    // Return null for empty string mappings (Sin asignar)
    return manualMappings[mappingKey] === '' || manualMappings[mappingKey] === 'empty-placeholder' ? null : manualMappings[mappingKey];
  }
  
  // Check direct mapping
  if (valueMap[field] && valueMap[field][normalized]) {
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
      return bestMatch;
    }
  }
  
  // CRITICAL: For UUID fields, never return non-UUID values
  // This prevents database constraint errors
  if (['type_id', 'subcategory_id', 'currency_id', 'wallet_id'].includes(field)) {
    if (!isValidUUID(stringValue)) {
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
  'categoria': 'category_id',
  'categoría': 'category_id',
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

  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Data hooks
  const { data: currentUser } = useCurrentUser()
  const organizationId = currentUser?.organization?.id
  const { data: movementConcepts } = useOrganizationMovementConcepts(organizationId)
  const { data: organizationCurrencies } = useOrganizationCurrencies(organizationId)
  const { data: organizationWallets } = useOrganizationWallets(organizationId)
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId)
  const { data: organizationProjects = [] } = useProjects(organizationId)
  
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
        }
      })
      
      if (Object.keys(autoMapping).length > 0) {
        setColumnMapping(autoMapping)
      }
    }
  }, [parsedData, columnMapping])

  // Scroll to top when entering step 3
  useEffect(() => {
    if (currentStep === 3) {
      // More aggressive scroll approach with multiple attempts
      setTimeout(() => {
        // Try all possible scroll containers at once
        const allScrollSelectors = [
          '[role="dialog"] [data-radix-scroll-area-viewport]',
          '[data-radix-dialog-content] [data-radix-scroll-area-viewport]', 
          '[data-radix-scroll-area-viewport]',
          '[role="dialog"] .overflow-y-auto',
          '[role="dialog"]',
          '.overflow-y-auto',
          '.max-h-\\[90vh\\]',
          '[data-modal-content]',
          '.modal-content',
          '[class*="overflow"]'
        ]
        
        // Scroll ALL possible containers to ensure we hit the right one
        let scrolledContainers = 0
        allScrollSelectors.forEach(selector => {
          const containers = document.querySelectorAll(selector)
          containers.forEach(container => {
            if (container && container.scrollTo) {
              container.scrollTo({ top: 0, behavior: 'instant' }) // Use instant for immediate effect
              scrolledContainers++
            }
          })
        })
        
        // Force scroll document as well
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
        window.scrollTo({ top: 0, behavior: 'instant' })
        
        
        // Second attempt after a brief moment to catch dynamic content
        setTimeout(() => {
          allScrollSelectors.forEach(selector => {
            const containers = document.querySelectorAll(selector)
            containers.forEach(container => {
              if (container && container.scrollTo) {
                container.scrollTop = 0 // Direct property assignment
                container.scrollTo(0, 0) // Alternative method
              }
            })
          })
          document.documentElement.scrollTop = 0
          document.body.scrollTop = 0
        }, 100)
        
      }, 100) // Reduced initial delay
    }
  }, [currentStep])

  // Filtrar conceptos por tipo
  const types = movementConcepts?.filter(c => !c.parent_id) || []
  // Get ALL concepts with parent_id (subcategories) - flatten the structure
  const categories = movementConcepts?.flatMap(concept => concept.children || []) || []

  // Function to find parent category name for a subcategory
  const findParentCategoryName = (subcategoryId: string): string => {
    for (const concept of movementConcepts || []) {
      if (concept.children) {
        const foundSubcategory = concept.children.find(child => child.id === subcategoryId);
        if (foundSubcategory) {
          return concept.name;
        }
      }
    }
    return 'Sin categoría padre';
  }

  // Function to get hierarchy info for field display
  const getFieldHierarchyInfo = (fieldName: string, value: string): string => {
    if (fieldName === 'category_id') {
      // For categories, show the actual Excel data context
      // Find the row in Excel that contains this category value
      if (parsedData?.rows) {
        const categoryColumnIndex = Object.keys(columnMapping).find(index => 
          columnMapping[parseInt(index)] === 'category_id'
        )
        const typeColumnIndex = Object.keys(columnMapping).find(index => 
          columnMapping[parseInt(index)] === 'type_id'
        )
        
        if (categoryColumnIndex !== undefined && typeColumnIndex !== undefined) {
          const row = parsedData.rows.find(row => row[parseInt(categoryColumnIndex)] === value)
          if (row && row[parseInt(typeColumnIndex)]) {
            const typeValue = row[parseInt(typeColumnIndex)]
            return `${typeValue} > ${value}`
          }
        }
      }
      
      // If we can't find the Excel context, just show the value
      return value
      
    } else if (fieldName === 'subcategory_id') {
      // For subcategories, show the actual Excel data context
      // Find the row in Excel that contains this subcategory value
      if (parsedData?.rows) {
        const subcategoryColumnIndex = Object.keys(columnMapping).find(index => 
          columnMapping[parseInt(index)] === 'subcategory_id'
        )
        const categoryColumnIndex = Object.keys(columnMapping).find(index => 
          columnMapping[parseInt(index)] === 'category_id'
        )
        
        if (subcategoryColumnIndex !== undefined && categoryColumnIndex !== undefined) {
          const row = parsedData.rows.find(row => row[parseInt(subcategoryColumnIndex)] === value)
          if (row && row[parseInt(categoryColumnIndex)]) {
            const categoryValue = row[parseInt(categoryColumnIndex)]
            return `${categoryValue} > ${value}`
          }
        }
      }
      
      // If we can't find the Excel context, just show the value
      return value
    }
    
    return value
  }
  

  
  // Create value mapping for normalization
  const valueMap = createValueMap(movementConcepts || [], organizationCurrencies || [], organizationWallets || [])
  
  // Debug valueMap construction
    type_id: Object.keys(valueMap.type_id || {}).length,
    subcategory_id: Object.keys(valueMap.subcategory_id || {}).length,
    currency_id: Object.keys(valueMap.currency_id || {}).length,
    wallet_id: Object.keys(valueMap.wallet_id || {}).length,
    subcategory_sample: Object.keys(valueMap.subcategory_id || {}).slice(0, 5),
    concepts_received: movementConcepts?.length || 0
  })

  // Create mutation for creating new categories
  const createCategoryMutation = useMutation({
    mutationFn: async ({ name, parentId, originalValue }: { name: string; parentId?: string; originalValue?: string }) => {
      if (!organizationId) throw new Error('Organization ID not found')
      
      const { data, error } = await supabase
        .from('movement_concepts')
        .insert({
          name: name.trim(),
          parent_id: parentId || null,
          organization_id: organizationId,
          description: `Categoría creada durante importación: ${name}`
        })
        .select()
        .single()

      if (error) throw error
      return { newConcept: data, originalValue }
    },
    onSuccess: ({ newConcept, originalValue }) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['organization-movement-concepts'] })
      
      // Auto-assign the new category/subcategory to the original value
      if (originalValue) {
        const fieldType = newConcept.parent_id ? 'subcategory_id' : 'category_id'
        const mappingKey = `${fieldType}_${originalValue}`
        
        setManualMappings(prev => ({
          ...prev,
          [mappingKey]: newConcept.id
        }))
        
        toast({
          title: "Categoría creada y asignada",
          description: `"${newConcept.name}" se creó y asignó automáticamente a "${originalValue}"`,
        })
      } else {
        toast({
          title: "Categoría creada",
          description: `"${newConcept.name}" se ha creado exitosamente`,
        })
      }
    },
    onError: (error) => {
      toast({
        title: "Error al crear categoría",
        description: "No se pudo crear la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      })
    },
  })

  // Function to render subcategory options with hierarchy
  const renderSubcategoryOptionsWithHierarchy = () => {
    const result: JSX.Element[] = []
    
    // Loop through all categories to show hierarchy
    categories.forEach(category => {
      if (category.children && category.children.length > 0) {
        category.children.forEach((subcategory, idx) => {
          result.push(
            <SelectItem key={`${category.id}-${subcategory.id}-${idx}`} value={subcategory.id}>
              <div className="flex flex-col">
                <span>{subcategory.name}</span>
                <span className="text-xs text-muted-foreground">
                  ↳ {category.name}
                </span>
              </div>
            </SelectItem>
          )
        })
      }
    })
    
    return result
  }

  // State for subcategory creation dialog
  const [showSubcategoryDialog, setShowSubcategoryDialog] = useState(false)
  const [pendingSubcategoryName, setPendingSubcategoryName] = useState('')
  const [selectedParentCategory, setSelectedParentCategory] = useState('')

  // Function to handle creating new categories/subcategories
  const handleCreateNewCategory = async (fieldName: string, value: string) => {
    if (fieldName === 'category_id') {
      // Create new category (parent level)
      await createCategoryMutation.mutateAsync({ 
        name: value, 
        originalValue: value 
      })
    } else if (fieldName === 'subcategory_id') {
      // For subcategories, show dialog to select parent category
      setPendingSubcategoryName(value)
      setShowSubcategoryDialog(true)
    }
  }

  // Function to create subcategory with selected parent
  const createSubcategoryWithParent = async () => {
    if (!selectedParentCategory || !pendingSubcategoryName) return
    
    await createCategoryMutation.mutateAsync({ 
      name: pendingSubcategoryName, 
      parentId: selectedParentCategory,
      originalValue: pendingSubcategoryName
    })
    
    // Reset dialog state
    setShowSubcategoryDialog(false)
    setPendingSubcategoryName('')
    setSelectedParentCategory('')
  }

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
    
    // Note: We allow advancing to step 3 even with unmapped values
    // The step 3 will handle manual mapping for values that couldn't be auto-mapped
    
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

        // Get user token for RLS authentication
        const { data: { session } } = await supabase.auth.getSession();
        const userToken = session?.access_token;

        const response = await fetch('/api/movements/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            movements: cleanedMovements,
            user_token: userToken
          })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Error ${response.status}: ${errorText}`)
        }
        
        return response.json()
      } catch (error) {
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
                  } else {
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
    
    // Check for any remaining text values in UUID fields
    const badMovements = processedMovements.filter(m => 
      (m.type_id && typeof m.type_id === 'string' && !m.type_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) ||
      (m.category_id && typeof m.category_id === 'string' && !m.category_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) ||
      (m.currency_id && typeof m.currency_id === 'string' && !m.currency_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) ||
      (m.wallet_id && typeof m.wallet_id === 'string' && !m.wallet_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) ||
      (m.subcategory_id && typeof m.subcategory_id === 'string' && !m.subcategory_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
    );
    
    if (badMovements.length > 0) {
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
        <UserSelectorField
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
              Formatos soportados: .xlsx, .xls, .csv (máximo 50MB)
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
        if (!normalizedVal || !isValidUUID(normalizedVal)) {
          return { 
            isValid: false, 
            suggestion: null,
            available: types.map(t => t.name),
            mappedValue: normalizedVal
          }
        }
        // Check if it's a direct UUID match with types table
        const typeMatch = types.find(t => t.id === normalizedVal)
        const isDirectTypeMatch = !!typeMatch
        
        return { 
          isValid: isDirectTypeMatch, 
          suggestion: typeMatch?.name,
          available: types.map(t => t.name),
          mappedValue: normalizedVal
        }
      case 'currency_id':
        const currencyNormalized = normalizeValue(fieldName, value, valueMap, manualMappings)
        if (!currencyNormalized || !isValidUUID(currencyNormalized)) {
          return { 
            isValid: false, 
            suggestion: null,
            available: organizationCurrencies?.map(c => c.currency.name) || [],
            mappedValue: currencyNormalized
          }
        }
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
        if (!walletNormalized || !isValidUUID(walletNormalized)) {
          return { 
            isValid: false, 
            suggestion: null,
            available: organizationWallets?.map(w => w.wallets.name) || [],
            mappedValue: walletNormalized
          }
        }
        // Check if it's a direct UUID match with organization wallets
        const walletMatch = organizationWallets?.find(w => w.id === walletNormalized)
        const isDirectWalletMatch = !!walletMatch
        return { 
          isValid: isDirectWalletMatch, 
          suggestion: walletMatch?.wallets?.name,
          available: organizationWallets?.map(w => w.wallets.name) || [],
          mappedValue: walletNormalized
        }
      case 'category_id':
        const categoryNormalized = normalizeValue(fieldName, value, valueMap, manualMappings)
        if (!categoryNormalized || !isValidUUID(categoryNormalized)) {
          return { 
            isValid: false, 
            suggestion: null,
            available: categories.map(c => c.name),
            mappedValue: categoryNormalized
          }
        }
        // Check if it's a direct UUID match with categories table (intermediate level)
        const categoryMatch = categories.find(c => c.id === categoryNormalized)
        const isDirectCategoryMatch = !!categoryMatch
        return { 
          isValid: isDirectCategoryMatch, 
          suggestion: categoryMatch?.name,
          available: categories.map(c => c.name),
          mappedValue: categoryNormalized
        }
      case 'subcategory_id':
        const subcategoryNormalized = normalizeValue(fieldName, value, valueMap, manualMappings)
        if (!subcategoryNormalized || !isValidUUID(subcategoryNormalized)) {
          const allSubcategoriesForValidation = categories?.flatMap(cat => cat.children || []) || []
          return { 
            isValid: false, 
            suggestion: null,
            available: allSubcategoriesForValidation.map(s => s.name),
            mappedValue: subcategoryNormalized
          }
        }
        // Check if it's a direct UUID match with subcategories table (deepest level)
        const allSubcategoriesForValidation = categories?.flatMap(cat => cat.children || []) || []
        const subcategoryMatch = allSubcategoriesForValidation.find(s => s.id === subcategoryNormalized)
        const isDirectSubcategoryMatch = !!subcategoryMatch
        return { 
          isValid: isDirectSubcategoryMatch, 
          suggestion: subcategoryMatch?.name,
          available: allSubcategoriesForValidation.map(s => s.name),
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
      case 'category_id':
        options = categories.map(c => ({ id: c.id, name: c.name }))
        break
      case 'currency_id':
        options = (organizationCurrencies || []).map(c => ({ id: c.currency.id, name: c.currency.name }))
        break
      case 'wallet_id':
        options = (organizationWallets || []).map(w => ({ id: w.id, name: w.wallets.name }))
        break
      case 'subcategory_id':
        const allSubcategoriesForOptions = categories?.flatMap(cat => cat.children || []) || []
        options = allSubcategoriesForOptions.map(s => ({ id: s.id, name: s.name }))
        break
      default:
        options = []
    }
    

    
    return options
  }

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="column-mapping" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Mapear columnas del archivo
        </Label>
        <p className="text-sm text-muted-foreground">
          Vincula las columnas de tu archivo Excel con los campos de Archub. Solo mapeo de columnas, el mapeo de valores será en el siguiente paso.
        </p>
      </div>

      {parsedData && (
        <div className="space-y-4">
          {/* Encabezados explicativos */}
          <div className="grid grid-cols-12 gap-4 items-center mb-2 px-4">
            <div className="col-span-1"></div>
            <div className="col-span-4">
              <div className="text-sm font-medium text-primary">TU ARCHIVO EXCEL</div>
              <div className="text-xs text-muted-foreground">Columnas encontradas</div>
            </div>
            <div className="col-span-1"></div>
            <div className="col-span-4">
              <div className="text-sm font-medium text-primary">CAMPOS DE ARCHUB</div>
              <div className="text-xs text-muted-foreground">Selecciona el campo correspondiente</div>
            </div>
            <div className="col-span-2"></div>
          </div>

          {parsedData.headers.map((header, index) => {
            const mappedField = columnMapping[index]
            const sampleValue = parsedData.rows[0]?.[index]
            
            return (
              <Card key={index} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 text-center">
                      <Badge variant="outline" className="text-xs font-mono w-8 h-6 font-bold">{String.fromCharCode(65 + index)}</Badge>
                    </div>
                    <div className="col-span-4">
                      <div className="font-medium text-sm text-foreground">{header}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Ejemplo: {sampleValue && <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{String(sampleValue).substring(0, 20)}{String(sampleValue).length > 20 ? '...' : ''}</span>}
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="col-span-4">
                      <Select 
                        value={columnMapping[index] || ''} 
                        onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [index]: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Seleccionar campo de Archub" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No mapear esta columna</SelectItem>
                          {AVAILABLE_FIELDS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 text-right">
                      {mappedField ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 text-xs border-green-200">
                          ✓ Vinculado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Sin vincular
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
          {Object.entries(incompatibleValues)
            .sort(([fieldNameA], [fieldNameB]) => {
              // Order according to movement table: CATEGORIA > SUBCATEGORIA > MONEDA > BILLETERA
              const order = ['category_id', 'subcategory_id', 'currency_id', 'wallet_id', 'type_id'];
              const indexA = order.indexOf(fieldNameA);
              const indexB = order.indexOf(fieldNameB);
              
              // If both fields are in the order list, sort by their position
              if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
              }
              
              // If only one field is in the order list, it comes first
              if (indexA !== -1) return -1;
              if (indexB !== -1) return 1;
              
              // If neither field is in the order list, sort alphabetically
              return fieldNameA.localeCompare(fieldNameB);
            })
            .map(([fieldName, values]) => {
            const fieldLabel = AVAILABLE_FIELDS.find(f => f.value === fieldName)?.label || fieldName
            return (
              <Card key={fieldName}>
                <CardContent className="p-4">
                <div className="mb-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Campo: {fieldLabel}</h4>
                    <p className="text-xs text-muted-foreground">
                      {values.length} valor(es) incompatible(s) encontrado(s)
                    </p>
                  </div>
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
                            <span className="font-mono text-sm">
                              {(() => {
                                const hierarchyText = getFieldHierarchyInfo(fieldName, value)
                                const parts = hierarchyText.split(' > ')
                                
                                if (parts.length === 2) {
                                  return (
                                    <>
                                      <span className="text-green-600 font-medium">{parts[0]} &gt;</span>
                                      <span className="text-orange-600 ml-1">{parts[1]}</span>
                                    </>
                                  )
                                }
                                
                                return <span className="text-orange-600">{hierarchyText}</span>
                              })()}
                            </span>
                          </div>
                          <div className="text-xs mt-1">
                            {fieldName === 'category_id' ? (
                              <span>
                                <span className="text-green-600 font-medium">Tipo de Archub &gt;</span>
                                <span className="text-muted-foreground ml-1">Valor de tu archivo</span>
                              </span>
                            ) : fieldName === 'subcategory_id' ? (
                              <span>
                                <span className="text-green-600 font-medium">Categoría de Archub &gt;</span>
                                <span className="text-muted-foreground ml-1">Valor de tu archivo</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Valor de tu archivo</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="col-span-1 text-center">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        
                        <div className="col-span-5">
                          <div className="space-y-2">
                            <ComboBox
                              key={`${mappingKey}-${manualMappings[mappingKey] || 'empty'}`}
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
                                } else if (fieldName === 'category_id') {
                                  selectedName = categories.find(c => c.id === selectedId)?.name || '';
                                } else if (fieldName === 'currency_id') {
                                  selectedName = organizationCurrencies?.find(c => c.currency.id === selectedId)?.currency?.name || '';
                                } else if (fieldName === 'wallet_id') {
                                  selectedName = organizationWallets?.find(w => w.wallets.id === selectedId)?.wallets?.name || '';
                                } else if (fieldName === 'subcategory_id') {
                                  const allSubcategoriesForToast = categories?.flatMap(cat => cat.children || []) || []
                                  selectedName = allSubcategoriesForToast.find(s => s.id === selectedId)?.name || '';
                                }
                                
                                toast({
                                  title: "Mapeo aplicado",
                                  description: `"${value}" → "${selectedName}"`
                                });
                              }}
                              options={[
                                { value: '', label: 'Sin asignar (NULL)' },
                                ...(fieldName === 'subcategory_id' 
                                  ? categories?.flatMap(cat => 
                                      (cat.children || []).map(sub => ({
                                        value: sub.id,
                                        label: `${cat.name} ↳ ${sub.name}`
                                      }))
                                    ) || []
                                  : getAvailableOptionsForField(fieldName).map(option => ({
                                      value: option.id,
                                      label: option.name
                                    }))
                                )
                              ]}
                              placeholder="Seleccionar valor o dejar sin asignar"
                              searchPlaceholder="Buscar..."
                              emptyMessage="No se encontraron opciones"
                              className="h-9"
                            />
                            
                            {/* Botón crear nuevo para categorías y subcategorías */}
                            {(fieldName === 'category_id' || fieldName === 'subcategory_id') && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => handleCreateNewCategory(fieldName, value)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Crear {fieldName === 'category_id' ? 'categoría' : 'subcategoría'} "{value}"
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="col-span-2">
                          {manualMappings[mappingKey] !== undefined ? (
                            <div className="flex items-center gap-1 text-green-700 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              <span>{manualMappings[mappingKey] === '' ? 'NULL' : 'Mapeado'}</span>
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

        {/* Dialog for selecting parent category when creating subcategory */}
        {showSubcategoryDialog && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4">Seleccionar categoría padre</h3>
              <p className="text-sm text-muted-foreground mb-4">
                La subcategoría "{pendingSubcategoryName}" necesita una categoría padre.
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label>Categoría padre</Label>
                  <Select 
                    value={selectedParentCategory} 
                    onValueChange={setSelectedParentCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría padre" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowSubcategoryDialog(false)
                      setPendingSubcategoryName('')
                      setSelectedParentCategory('')
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={createSubcategoryWithParent}
                    disabled={!selectedParentCategory}
                  >
                    Crear subcategoría
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderStep4 = () => {
    // Check for normalized values to show preview
    const normalizedValues = new Set<string>()
    
    if (parsedData) {
      parsedData.rows.slice(0, 10).forEach((row) => {
        Object.entries(columnMapping).forEach(([columnIndex, fieldName]) => {
          if (['type_id', 'category_id', 'currency_id', 'wallet_id', 'subcategory_id'].includes(fieldName)) {
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
    <>
      <FormModalLayout
        headerContent={headerContent}
        footerContent={footerContent}
        stepContent={getCurrentStepContent()}
        onClose={onClose}
        columns={1}
        className="md:min-w-[800px] md:max-w-[1000px]"
      />
      
      {/* Dialog for creating subcategory with parent selection */}
      {showSubcategoryDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Crear subcategoría "{pendingSubcategoryName}"
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona la categoría padre para esta subcategoría:
            </p>
            
            <div className="space-y-4">
              <Select value={selectedParentCategory} onValueChange={setSelectedParentCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría padre" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSubcategoryDialog(false)
                    setPendingSubcategoryName('')
                    setSelectedParentCategory('')
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={createSubcategoryWithParent}
                  disabled={!selectedParentCategory || createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? 'Creando...' : 'Crear subcategoría'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}