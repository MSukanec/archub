import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, FileText, AlertCircle, CheckCircle, X, MoreHorizontal } from 'lucide-react'
import { useMovementConcepts } from '@/hooks/use-movement-concepts'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface ImportMovementsModalProps {
  open: boolean
  onClose: () => void
  onImport: (movements: any[]) => void
}

interface ParsedData {
  headers: string[]
  rows: any[][]
  fileName: string
}

interface ColumnMapping {
  [key: string]: string // header -> field mapping
}

interface ValidationError {
  row: number
  column: string
  message: string
}

const FIELD_OPTIONS = [
  { value: '', label: 'Ignorar columna' },
  { value: 'movement_date', label: 'Fecha' },
  { value: 'description', label: 'Descripción' },
  { value: 'amount', label: 'Monto' },
  { value: 'type', label: 'Tipo (Ingreso/Egreso)' },
  { value: 'category', label: 'Categoría' },
  { value: 'subcategory', label: 'Subcategoría' },
  { value: 'currency', label: 'Moneda' },
  { value: 'wallet', label: 'Billetera' },
]

const REQUIRED_FIELDS = ['movement_date', 'amount', 'type']

export default function ImportMovementsModal({ open, onClose, onImport }: ImportMovementsModalProps) {
  const [step, setStep] = useState(1)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [dropzoneKey, setDropzoneKey] = useState(0) // Force dropzone reset
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set()) // Track selected rows

  // Data hooks
  const { data: currentUser } = useCurrentUser()
  const { data: movementConcepts } = useMovementConcepts()
  const { data: organizationCurrencies } = useOrganizationCurrencies()
  const { data: organizationWallets } = useOrganizationWallets()

  const types = movementConcepts?.filter(c => c.type === 'type') || []
  const categories = movementConcepts?.filter(c => c.type === 'category') || []
  const subcategories = movementConcepts?.filter(c => c.type === 'subcategory') || []

  // Reset modal state when closing
  const handleClose = () => {
    setStep(1)
    setParsedData(null)
    setColumnMapping({})
    setValidationErrors([])
    setIsProcessing(false)
    setSelectedRows(new Set())
    setDropzoneKey(prev => prev + 1) // Force dropzone reset
    onClose()
  }

  // Reset modal state when opening
  React.useEffect(() => {
    if (open) {
      setStep(1)
      setParsedData(null)
      setColumnMapping({})
      setValidationErrors([])
      setIsProcessing(false)
      // Force dropzone reset by changing key
      setDropzoneKey(prev => prev + 1)
    }
  }, [open])

  // File processing
  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true)
    try {
      console.log('Processing file:', file.name, 'Size:', file.size)
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      
      if (isExcel) {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const worksheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[worksheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        console.log('Excel data parsed:', jsonData.length, 'rows')
        
        if (jsonData.length > 0) {
          const headers = jsonData[0] as string[]
          const rows = jsonData.slice(1) as any[][]
          
          // Filter out empty headers and keep track of original indices
          const validHeaders = headers
            .map((h, index) => ({ header: h, index }))
            .filter(({ header }) => header && header.toString().trim())
            .map(({ header }) => header.toString().trim())
          
          if (validHeaders.length === 0) {
            console.error('No valid headers found in Excel file')
            alert('No se encontraron columnas válidas en el archivo. Verifica que la primera fila contenga los nombres de las columnas.')
            return
          }
          
          const parsedResult = {
            headers: validHeaders,
            rows: rows.slice(0, 100), // Limit to first 100 rows for preview
            fileName: file.name
          }
          
          console.log('Parsed data:', parsedResult)
          setParsedData(parsedResult)
          setStep(2)
        }
      } else {
        const text = await file.text()
        Papa.parse(text, {
          complete: (results) => {
            console.log('CSV data parsed:', results.data.length, 'rows')
            if (results.data.length > 0) {
              const headers = results.data[0] as string[]
              const rows = results.data.slice(1) as any[][]
              
              // Filter out empty headers and keep track of original indices
              const validHeaders = headers
                .map((h, index) => ({ header: h, index }))
                .filter(({ header }) => header && header.toString().trim())
                .map(({ header }) => header.toString().trim())
              
              if (validHeaders.length === 0) {
                console.error('No valid headers found in CSV file')
                alert('No se encontraron columnas válidas en el archivo. Verifica que la primera fila contenga los nombres de las columnas.')
                return
              }
              
              const parsedResult = {
                headers: validHeaders,
                rows: rows.slice(0, 100), // Limit to first 100 rows for preview
                fileName: file.name
              }
              
              console.log('Parsed data:', parsedResult)
              setParsedData(parsedResult)
              setStep(2)
            }
          },
          header: false,
          skipEmptyLines: true
        })
      }
      
    } catch (error) {
      console.error('Error processing file:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    key: dropzoneKey,
    onDrop: (files) => {
      if (files.length > 0) {
        processFile(files[0])
      }
    },
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: isProcessing
  })

  // Auto-suggest column mapping
  const getSuggestedMapping = (header: string): string => {
    const headerLower = header.toLowerCase()
    
    if (headerLower.includes('fecha') || headerLower.includes('date')) return 'movement_date'
    if (headerLower.includes('descripcion') || headerLower.includes('description') || headerLower.includes('detalle')) return 'description'
    if (headerLower.includes('monto') || headerLower.includes('amount') || headerLower.includes('importe')) return 'amount'
    if (headerLower.includes('tipo') || headerLower.includes('type')) return 'type'
    if (headerLower.includes('categoria') || headerLower.includes('category')) return 'category'
    if (headerLower.includes('subcategoria') || headerLower.includes('subcategory')) return 'subcategory'
    if (headerLower.includes('moneda') || headerLower.includes('currency')) return 'currency'
    if (headerLower.includes('billetera') || headerLower.includes('wallet')) return 'wallet'
    
    return ''
  }

  // Initialize column mapping with suggestions
  React.useEffect(() => {
    if (parsedData && step === 2) {
      const suggestedMapping: ColumnMapping = {}
      parsedData.headers.forEach(header => {
        suggestedMapping[header] = getSuggestedMapping(header)
      })
      setColumnMapping(suggestedMapping)
    }
  }, [parsedData, step])

  // Validate mapped data
  const validateData = (): ValidationError[] => {
    const errors: ValidationError[] = []
    
    if (!parsedData) return errors
    
    // Check if required fields are mapped
    const mappedFields = Object.values(columnMapping).filter(field => field !== '')
    const missingRequiredFields = REQUIRED_FIELDS.filter(field => !mappedFields.includes(field))
    
    if (missingRequiredFields.length > 0) {
      errors.push({
        row: -1,
        column: 'mapping',
        message: `Campos obligatorios faltantes: ${missingRequiredFields.join(', ')}`
      })
    }
    
    // Validate data in each row
    parsedData.rows.forEach((row, rowIndex) => {
      Object.entries(columnMapping).forEach(([header, field]) => {
        if (field === '') return // Skip ignored columns
        
        const columnIndex = parsedData.headers.indexOf(header)
        const value = row[columnIndex]
        
        // Check required fields
        if (REQUIRED_FIELDS.includes(field) && (!value || value.toString().trim() === '')) {
          errors.push({
            row: rowIndex,
            column: field,
            message: `Campo obligatorio vacío: ${field}`
          })
        }
        
        // Validate date format
        if (field === 'movement_date' && value) {
          const date = new Date(value)
          if (isNaN(date.getTime())) {
            errors.push({
              row: rowIndex,
              column: field,
              message: 'Fecha inválida'
            })
          }
        }
        
        // Validate amount
        if (field === 'amount' && value) {
          const amount = parseFloat(value.toString().replace(',', '.'))
          if (isNaN(amount) || amount <= 0) {
            errors.push({
              row: rowIndex,
              column: field,
              message: 'Monto inválido'
            })
          }
        }
      })
    })
    
    return errors
  }

  // Move to preview step
  const handleMappingComplete = () => {
    const errors = validateData()
    setValidationErrors(errors)
    
    // Select all rows by default
    if (parsedData) {
      const allRowIndices = new Set(parsedData.rows.map((_, index) => index))
      setSelectedRows(allRowIndices)
    }
    
    setStep(3)
  }

  // Process final import
  const handleImport = () => {
    if (!parsedData || !currentUser) return
    
    // Only process selected rows
    const processedMovements = parsedData.rows
      .map((row, index) => {
        // Skip if row is not selected
        if (!selectedRows.has(index)) return null
        
        const movement: any = {}
        
        Object.entries(columnMapping).forEach(([header, field]) => {
          if (field === '') return // Skip ignored columns
          
          const columnIndex = parsedData.headers.indexOf(header)
          const value = row[columnIndex]
          
          if (value !== undefined && value !== null && value !== '') {
            movement[field] = value
          }
        })
        
        // Add project_id from current user preferences
        if (currentUser.preferences?.last_project_id) {
          movement.project_id = currentUser.preferences.last_project_id
        }
        
        return movement
      })
      .filter(movement => {
        // Only include valid movements with required fields
        return movement !== null && REQUIRED_FIELDS.every(field => movement[field] !== undefined)
      })
    
    onImport(processedMovements)
    handleClose()
  }

  // Handle row selection
  const handleRowSelection = (rowIndex: number, checked: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(rowIndex)
      } else {
        newSet.delete(rowIndex)
      }
      return newSet
    })
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (!parsedData) return
    
    if (checked) {
      const allRowIndices = new Set(parsedData.rows.map((_, index) => index))
      setSelectedRows(allRowIndices)
    } else {
      setSelectedRows(new Set())
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div key={dropzoneKey} className="space-y-6">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-accent bg-accent/10" : "border-border hover:border-accent/50",
                isProcessing && "pointer-events-none opacity-50"
              )}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <div>
                  <Upload className="mx-auto h-8 w-8 text-accent mb-2" />
                  <p>Suelta el archivo aquí...</p>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm">
                    Arrastra y suelta tu archivo aquí, o{' '}
                    <span className="text-accent font-medium">haz clic para seleccionar</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Archivos soportados: .xlsx, .xls, .csv
                  </p>
                </div>
              )}
            </div>
            
            {acceptedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Archivo seleccionado:</Label>
                <div className="flex items-center justify-between gap-2 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{acceptedFiles[0].name}</span>
                    <Badge variant="secondary">{(acceptedFiles[0].size / 1024).toFixed(1)} KB</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Reset everything and force dropzone reset
                      setParsedData(null)
                      setStep(1)
                      setDropzoneKey(prev => prev + 1)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Mapear columnas</h3>
              <p className="text-sm text-muted-foreground">
                Indica a qué campo del sistema corresponde cada columna de tu archivo
              </p>
            </div>
            
            {parsedData && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{parsedData.fileName}</span>
                  <Badge variant="secondary">{parsedData.rows.length} filas</Badge>
                </div>
                
                <div className="space-y-4">
                  {parsedData.headers.map((header, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <Label className="font-medium">{header}</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ejemplo: {parsedData.rows[0]?.[index] || 'N/A'}
                        </p>
                      </div>
                      <div className="w-48">
                        <Select
                          value={columnMapping[header] || ''}
                          onValueChange={(value) => {
                            setColumnMapping(prev => ({
                              ...prev,
                              [header]: value
                            }))
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar campo" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {REQUIRED_FIELDS.includes(columnMapping[header]) && (
                        <Badge variant="destructive">Obligatorio</Badge>
                      )}
                    </div>
                  ))}
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Los campos <strong>Fecha</strong>, <strong>Monto</strong> y <strong>Tipo</strong> son obligatorios.
                    Las columnas no mapeadas serán ignoradas.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Previsualización</h3>
              <p className="text-sm text-muted-foreground">
                Revisa los datos antes de importar. Los errores se muestran en rojo.
              </p>
            </div>
            
            {currentUser?.preferences?.last_project_id && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Los movimientos se importarán al <strong>proyecto actual</strong>. 
                  Selecciona las filas que deseas importar usando los checkboxes.
                </AlertDescription>
              </Alert>
            )}
            
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p>Se encontraron {validationErrors.length} errores:</p>
                    {validationErrors.slice(0, 3).map((error, index) => (
                      <p key={index} className="text-xs">
                        • {error.row >= 0 ? `Fila ${error.row + 1}` : 'Mapeo'}: {error.message}
                      </p>
                    ))}
                    {validationErrors.length > 3 && (
                      <p className="text-xs">... y {validationErrors.length - 3} más</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {parsedData && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRows.size === parsedData.rows.length && parsedData.rows.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(checked === true)}
                        />
                      </TableHead>
                      <TableHead className="w-12">#</TableHead>
                      {Object.entries(columnMapping)
                        .filter(([, field]) => field !== '')
                        .map(([header, field]) => (
                          <TableHead key={header}>
                            {FIELD_OPTIONS.find(opt => opt.value === field)?.label || field}
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.rows.slice(0, 10).map((row, rowIndex) => {
                      const rowErrors = validationErrors.filter(err => err.row === rowIndex)
                      const hasErrors = rowErrors.length > 0
                      
                      return (
                        <TableRow key={rowIndex} className={hasErrors ? 'bg-destructive/10' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRows.has(rowIndex)}
                              onCheckedChange={(checked) => handleRowSelection(rowIndex, checked === true)}
                            />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {rowIndex + 1}
                          </TableCell>
                          {Object.entries(columnMapping)
                            .filter(([, field]) => field !== '')
                            .map(([header, field]) => {
                              const columnIndex = parsedData.headers.indexOf(header)
                              const value = row[columnIndex]
                              const hasError = rowErrors.some(err => err.column === field)
                              
                              return (
                                <TableCell 
                                  key={header} 
                                  className={cn(
                                    "text-xs",
                                    hasError && "text-destructive font-medium"
                                  )}
                                >
                                  {value || '-'}
                                </TableCell>
                              )
                            })}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                
                {parsedData.rows.length > 10 && (
                  <div className="p-3 bg-muted text-center text-xs text-muted-foreground">
                    ... y {parsedData.rows.length - 10} filas más
                  </div>
                )}
              </div>
            )}
          </div>
        )
        
      default:
        return null
    }
  }

  // Render navigation buttons
  const renderFooterButtons = () => {
    const buttons = []
    
    if (step > 1) {
      buttons.push(
        <Button
          key="back"
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={isProcessing}
        >
          Atrás
        </Button>
      )
    }
    
    buttons.push(
      <Button
        key="cancel"
        variant="secondary"
        onClick={handleClose}
        disabled={isProcessing}
      >
        Cancelar
      </Button>
    )
    
    if (step === 1) {
      // No next button for step 1, file processing handles the transition
    } else if (step === 2) {
      const mappedFields = Object.values(columnMapping).filter(field => field !== '')
      const hasRequiredFields = REQUIRED_FIELDS.every(field => mappedFields.includes(field))
      
      buttons.push(
        <Button
          key="next"
          onClick={handleMappingComplete}
          disabled={!hasRequiredFields || isProcessing}
        >
          Siguiente
        </Button>
      )
    } else if (step === 3) {
      const hasBlockingErrors = validationErrors.some(err => err.row === -1)
      
      buttons.push(
        <Button
          key="import"
          onClick={handleImport}
          disabled={hasBlockingErrors || isProcessing || selectedRows.size === 0}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Importar {selectedRows.size} movimientos
        </Button>
      )
    }
    
    return buttons
  }

  if (!open) return null

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title="Importar movimientos desde Excel"
            description={`Paso ${step} de 3`}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="lg" columns={1} className="min-h-[500px]">
            {renderStepContent()}
          </CustomModalBody>
        ),
        footer: (
          <div className="flex justify-between p-6 border-t">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(stepNumber => (
                <div
                  key={stepNumber}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                    stepNumber === step 
                      ? "bg-accent text-accent-foreground" 
                      : stepNumber < step 
                        ? "bg-green-100 text-green-800" 
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {stepNumber < step ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              {renderFooterButtons()}
            </div>
          </div>
        )
      }}
    </CustomModalLayout>
  )
}