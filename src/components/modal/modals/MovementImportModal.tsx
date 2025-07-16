import React, { useState, useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Upload, FileText, AlertCircle, CheckCircle, X, RefreshCcw } from 'lucide-react'
import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
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
import { useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface MovementImportModalProps {
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
  field: string
  message: string
}

// Campos disponibles para mapeo
const AVAILABLE_FIELDS = [
  { value: '', label: 'No mapear' },
  { value: 'movement_date', label: 'Fecha' },
  { value: 'description', label: 'Descripción' },
  { value: 'amount', label: 'Cantidad' },
  { value: 'currency', label: 'Moneda' },
  { value: 'wallet', label: 'Billetera' },
  { value: 'type', label: 'Tipo' },
  { value: 'category', label: 'Categoría' },
  { value: 'subcategory', label: 'Subcategoría' },
  { value: 'exchange_rate', label: 'Cotización' }
]

export default function MovementImportModal({ modalData, onClose }: MovementImportModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [dropzoneKey, setDropzoneKey] = useState(0)
  
  const { setPanel } = useModalPanelStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Data hooks
  const { data: currentUser } = useCurrentUser()
  const { data: movementConcepts } = useMovementConcepts()
  const { data: organizationCurrencies } = useOrganizationCurrencies()
  const { data: organizationWallets } = useOrganizationWallets()

  const types = movementConcepts?.filter(c => c.type === 'type') || []
  const categories = movementConcepts?.filter(c => c.type === 'category') || []
  const subcategories = movementConcepts?.filter(c => c.type === 'subcategory') || []

  // Set panel to edit mode
  useEffect(() => {
    setPanel('edit')
  }, [setPanel])

  // Reset state when modal opens
  useEffect(() => {
    if (modalData?.reset) {
      handleReset()
    }
  }, [modalData?.reset])

  const handleReset = () => {
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
      console.log('Processing file:', file.name, 'Size:', file.size)
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
          
          // Filter out empty headers
          const validHeaders = headers
            .map((h, index) => ({ header: h, index }))
            .filter(({ header }) => header && header.toString().trim())
            .map(({ header }) => header.toString().trim())
          
          if (validHeaders.length === 0) {
            toast({
              title: "Error al procesar archivo",
              description: "No se encontraron columnas válidas en el archivo",
              variant: "destructive"
            })
            return
          }
          
          const parsedResult = {
            headers: validHeaders,
            rows: rows,
            fileName: file.name
          }
          
          setParsedData(parsedResult)
          setCurrentStep(2)
        }
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text()
        Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as string[][]
            if (data.length > 0) {
              const headers = data[0]
              const rows = data.slice(1)
              
              const validHeaders = headers
                .filter(h => h && h.trim())
                .map(h => h.trim())
              
              if (validHeaders.length === 0) {
                toast({
                  title: "Error al procesar archivo",
                  description: "No se encontraron columnas válidas en el archivo CSV",
                  variant: "destructive"
                })
                return
              }
              
              setParsedData({
                headers: validHeaders,
                rows: rows,
                fileName: file.name
              })
              setCurrentStep(2)
            }
          }
        })
      } else {
        toast({
          title: "Formato no soportado",
          description: "Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error processing file:', error)
      toast({
        title: "Error al procesar archivo",
        description: "Hubo un problema al procesar el archivo",
        variant: "destructive"
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

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (processedMovements: any[]) => {
      console.log('Importing movements:', processedMovements)
      
      // Import using Supabase
      const { supabase } = await import('@/lib/supabase')
      
      // Batch insert movements
      for (const movement of processedMovements) {
        const { error } = await supabase
          .from('movements')
          .insert([movement])
        
        if (error) {
          console.error('Error inserting movement:', error)
          throw error
        }
      }
      
      return processedMovements
    },
    onSuccess: (importedMovements) => {
      toast({
        title: "Importación exitosa",
        description: `Se importaron ${importedMovements.length} movimientos correctamente`
      })
      
      // Invalidate movements cache
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      
      onClose()
    },
    onError: (error) => {
      console.error('Import error:', error)
      toast({
        title: "Error en la importación",
        description: "Hubo un problema al importar los movimientos",
        variant: "destructive"
      })
    }
  })

  // Handle import
  const handleImport = () => {
    if (!parsedData || !currentUser) return

    // Process selected rows
    const selectedRowsArray = Array.from(selectedRows)
    const rowsToProcess = selectedRowsArray.length > 0 
      ? selectedRowsArray.map(index => parsedData.rows[index])
      : parsedData.rows

    const processedMovements = rowsToProcess.map((row, index) => {
      // Convert Excel date serial number to proper date if needed
      let movementDate = null
      if (columnMapping[parsedData.headers.findIndex(h => h === 'movement_date')?.toString()]) {
        const dateValue = row[parsedData.headers.findIndex(h => h === 'movement_date')]
        if (typeof dateValue === 'number' && dateValue > 40000) {
          // Excel date serial number to JavaScript date
          const excelEpoch = new Date(1900, 0, 1)
          const jsDate = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000)
          movementDate = jsDate.toISOString().split('T')[0]
        } else if (dateValue) {
          movementDate = dateValue
        }
      }

      const movement: any = {
        description: 'Movimiento importado',
        amount: 0,
        movement_date: movementDate || new Date().toISOString().split('T')[0],
        organization_id: currentUser?.preferences?.last_organization_id,
        project_id: modalData?.projectId || currentUser?.preferences?.last_project_id,
        created_by: currentUser?.user?.id,
        is_favorite: false
      }

      // Map columns to movement fields
      Object.entries(columnMapping).forEach(([columnIndex, fieldName]) => {
        if (fieldName && row[parseInt(columnIndex)]) {
          const value = row[parseInt(columnIndex)]
          
          // Handle special field types
          switch (fieldName) {
            case 'movement_date':
              if (typeof value === 'number' && value > 40000) {
                const excelEpoch = new Date(1900, 0, 1)
                const jsDate = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000)
                movement[fieldName] = jsDate.toISOString().split('T')[0]
              } else {
                movement[fieldName] = value
              }
              break
            case 'amount':
              movement[fieldName] = parseFloat(value) || 0
              break
            case 'exchange_rate':
              movement[fieldName] = parseFloat(value) || null
              break
            case 'description':
              movement[fieldName] = value || 'Movimiento importado'
              break
            default:
              // Only add field if value exists and is not empty string
              if (value && value.toString().trim()) {
                movement[fieldName] = value
              }
          }
        }
      })

      return movement
    }).filter(movement => movement.amount > 0) // Only import movements with valid amounts

    if (processedMovements.length === 0) {
      toast({
        title: "Sin movimientos válidos",
        description: "No se encontraron movimientos válidos para importar",
        variant: "destructive"
      })
      return
    }

    importMutation.mutate(processedMovements)
  }

  // Toggle row selection
  const toggleRowSelection = (rowIndex: number) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(rowIndex)) {
      newSelection.delete(rowIndex)
    } else {
      newSelection.add(rowIndex)
    }
    setSelectedRows(newSelection)
  }

  // Toggle all rows selection
  const toggleAllRows = () => {
    if (selectedRows.size === parsedData?.rows.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(parsedData?.rows.map((_, index) => index) || []))
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Seleccionar archivo</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Arrastra y suelta un archivo Excel (.xlsx, .xls) o CSV, o haz clic para seleccionar
              </p>
            </div>

            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  <span>Procesando archivo...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm">
                    {isDragActive ? "Suelta el archivo aquí" : "Haz clic o arrastra un archivo"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formatos soportados: .xlsx, .xls, .csv
                  </p>
                </div>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                El archivo debe tener una fila de encabezados en la primera línea
              </AlertDescription>
            </Alert>
          </div>
        )

      case 2:
        if (!parsedData) return null

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Mapear columnas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona qué campo representa cada columna de tu archivo
              </p>
              
              <Alert className="mb-4">
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Archivo: <strong>{parsedData.fileName}</strong> ({parsedData.rows.length} filas)
                </AlertDescription>
              </Alert>
            </div>

            <div className="grid gap-4">
              {parsedData.headers.map((header, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Label className="min-w-[120px] text-sm font-medium">
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
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_FIELDS.map(field => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )

      case 3:
        if (!parsedData) return null

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-2">Vista previa y confirmación</h3>
                <p className="text-sm text-muted-foreground">
                  Revisa los datos antes de importar
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedRows.size === parsedData.rows.length}
                  onCheckedChange={toggleAllRows}
                />
                <Label className="text-sm">
                  Seleccionar todas ({parsedData.rows.length} filas)
                </Label>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRows.size === parsedData.rows.length}
                        onCheckedChange={toggleAllRows}
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
                          onCheckedChange={() => toggleRowSelection(rowIndex)}
                        />
                      </TableCell>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="max-w-[200px] truncate">
                          {cell?.toString() || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {parsedData.rows.length > 10 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrando las primeras 10 filas de {parsedData.rows.length} total
              </p>
            )}

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {selectedRows.size > 0 
                  ? `Se importarán ${selectedRows.size} filas seleccionadas`
                  : `Se importarán todas las ${parsedData.rows.length} filas`
                }
              </AlertDescription>
            </Alert>
          </div>
        )

      default:
        return null
    }
  }

  // Footer content based on step
  const getFooterProps = () => {
    switch (currentStep) {
      case 1:
        return {
          cancelText: "Cancelar",
          submitText: null,
          showSubmit: false,
          onCancel: onClose
        }

      case 2:
        return {
          cancelText: "Volver",
          submitText: "Continuar",
          showSubmit: true,
          onCancel: () => setCurrentStep(1),
          onSubmit: () => {
            const hasMappedFields = Object.values(columnMapping).some(value => value)
            if (!hasMappedFields) {
              toast({
                title: "Sin mapeo de campos",
                description: "Debes mapear al menos un campo antes de continuar",
                variant: "destructive"
              })
              return
            }
            setCurrentStep(3)
          },
          disabled: Object.keys(columnMapping).length === 0
        }

      case 3:
        return {
          cancelText: "Volver",
          submitText: "Importar",
          showSubmit: true,
          onCancel: () => setCurrentStep(2),
          onSubmit: handleImport,
          loading: importMutation.isPending,
          disabled: !parsedData || parsedData.rows.length === 0
        }

      default:
        return {
          cancelText: "Cancelar",
          submitText: null,
          showSubmit: false,
          onCancel: onClose
        }
    }
  }

  const footerProps = getFooterProps()

  return (
    <FormModalLayout>
      <FormModalHeader 
        title="Importar Movimientos"
        description={`Paso ${currentStep} de 3`}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {renderStepContent()}
      </div>

      <FormModalFooter
        cancelText={footerProps.cancelText}
        submitText={footerProps.submitText}
        showSubmit={footerProps.showSubmit}
        onCancel={footerProps.onCancel}
        onSubmit={footerProps.onSubmit}
        loading={footerProps.loading}
        disabled={footerProps.disabled}
      />
    </FormModalLayout>
  )
}