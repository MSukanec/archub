import React, { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Upload, FileText, AlertCircle, CheckCircle, X, RefreshCcw } from 'lucide-react'
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
import { useMovementConcepts } from '@/hooks/use-movement-concepts'
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
  const valueMap: { [key: string]: { [key: string]: string } } = {
    type_id: {
      'ingreso': 'INGRESO',
      'ingresos': 'INGRESO',
      'entrada': 'INGRESO',
      'cobro': 'INGRESO',
      'egreso': 'EGRESO', 
      'egresos': 'EGRESO',
      'salida': 'EGRESO',
      'gasto': 'EGRESO',
      'pago': 'EGRESO'
    }
  };

  // Add currency mappings
  if (currencies?.length) {
    valueMap.currency_id = {};
    currencies.forEach(currency => {
      const normalized = normalizeText(currency.name);
      valueMap.currency_id[normalized] = currency.id;
      valueMap.currency_id[normalizeText(currency.code)] = currency.id;
    });
  }

  // Add wallet mappings
  if (wallets?.length) {
    valueMap.wallet_id = {};
    wallets.forEach(wallet => {
      const normalized = normalizeText(wallet.name);
      valueMap.wallet_id[normalized] = wallet.id;
    });
  }

  // Add concept mappings
  if (concepts?.length) {
    valueMap.subcategory_id = {};
    concepts.forEach(concept => {
      const normalized = normalizeText(concept.name);
      valueMap.subcategory_id[normalized] = concept.id;
    });
  }

  return valueMap;
};

const normalizeValue = (field: string, value: any, valueMap: any): any => {
  if (!value || typeof value !== 'string') return value;
  
  const normalized = normalizeText(value);
  return valueMap[field]?.[normalized] || value;
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
  { value: '', label: 'No mapear' },
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

export default function MovementImportStepModal({ modalData, onClose }: MovementImportStepModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [dropzoneKey, setDropzoneKey] = useState(0)
  const [selectedCreator, setSelectedCreator] = useState<string>('')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Data hooks
  const { data: currentUser } = useCurrentUser()
  const organizationId = currentUser?.organization?.id
  const { data: movementConcepts } = useMovementConcepts()
  const { data: organizationCurrencies } = useOrganizationCurrencies()
  const { data: organizationWallets } = useOrganizationWallets()
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

  // Filtrar conceptos por tipo
  const types = movementConcepts?.filter(c => !c.parent_id) || []
  const categories = movementConcepts?.filter(c => c.parent_id && movementConcepts.find(parent => parent.id === c.parent_id && !parent.parent_id)) || []
  
  // Create value mapping for normalization
  const valueMap = createValueMap(movementConcepts || [], organizationCurrencies || [], organizationWallets || [])

  // Reset modal state
  const resetModal = () => {
    setCurrentStep(1)
    setParsedData(null)
    setColumnMapping({})
    setValidationErrors([])
    setIsProcessing(false)
    setSelectedRows(new Set())
    setDropzoneKey(prev => prev + 1)
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
    
    setValidationErrors(errors)
    return errors.length === 0
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
    
    const selectedRowsArray = Array.from(selectedRows)
    const rowsToProcess = selectedRowsArray.length > 0 
      ? selectedRowsArray.map(index => parsedData.rows[index])
      : parsedData.rows

    const processedMovements = rowsToProcess.map((row) => {
      const movement: any = {
        description: 'Movimiento importado',
        amount: 0,
        movement_date: new Date().toISOString().split('T')[0],
        organization_id: currentUser.organization.id,
        project_id: modalData?.projectId || currentUser.preferences?.last_project_id,
        created_by: selectedCreator || currentUser.user?.id,
        is_favorite: false
      }

      // Map columns to movement fields
      Object.entries(columnMapping).forEach(([columnIndex, fieldName]) => {
        if (fieldName && row[parseInt(columnIndex)] !== undefined) {
          const value = row[parseInt(columnIndex)]
          
          switch (fieldName) {
            case 'movement_date':
              if (typeof value === 'number' && value > 40000) {
                const excelEpoch = new Date(1900, 0, 1)
                const jsDate = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000)
                movement.movement_date = jsDate.toISOString().split('T')[0]
              } else if (value) {
                movement.movement_date = value
              }
              break
            case 'amount':
              movement.amount = parseFloat(value) || 0
              break
            case 'exchange_rate':
              movement.exchange_rate = parseFloat(value) || 1
              break
            default:
              // Apply value normalization for specific fields
              if (['type_id', 'currency_id', 'wallet_id', 'subcategory_id'].includes(fieldName)) {
                const normalizedValue = normalizeValue(fieldName, value, valueMap)
                console.log(`Normalizing ${fieldName}: "${value}" → "${normalizedValue}"`)
                movement[fieldName] = normalizedValue
              } else {
                movement[fieldName] = value
              }
          }
        }
      })

      return movement
    })

    importMutation.mutate(processedMovements)
  }

  // Step configurations
  const stepConfig: StepModalConfig = {
    currentStep,
    totalSteps: 3,
    stepTitle: currentStep === 1 ? 'Seleccionar archivo' : 
               currentStep === 2 ? 'Mapear columnas' : 
               'Vista previa e importar'
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
            }
          },
          nextAction: {
            label: 'Siguiente',
            onClick: () => {
              if (validateMapping()) {
                setCurrentStep(3)
              }
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

      <Alert>
        <AlertCircle className="h-4 w-4" />
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

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Mapear columnas</h3>
        <p className="text-sm text-muted-foreground">
          Asigna cada columna del archivo a un campo de movimiento
        </p>
      </div>

      {parsedData && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {parsedData.headers.map((header, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 items-center">
                <Label className="font-medium">
                  {header}
                </Label>
                <Select
                  value={columnMapping[index.toString()] || ''}
                  onValueChange={(value) => {
                    setColumnMapping(prev => ({
                      ...prev,
                      [index.toString()]: value
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar campo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_FIELDS.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validationErrors.map((error, index) => (
                  <div key={index}>{error.message}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )

  const renderStep3 = () => {
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