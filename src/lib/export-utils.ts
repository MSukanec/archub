import * as XLSX from 'xlsx'

interface ExportColumn {
  key: string
  label: string
  render?: (item: any) => any
}

interface ExportOptions {
  filename?: string
  sheetName?: string
  columns: ExportColumn[]
  data: any[]
}

/**
 * Exports data to Excel file
 */
export function exportToExcel(options: ExportOptions) {
  const {
    filename = 'export.xlsx',
    sheetName = 'Data',
    columns,
    data
  } = options

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new()
  
  // Prepare data for Excel
  const excelData: any[][] = []
  
  // Add headers
  const headers = columns.map(col => col.label)
  excelData.push(headers)
  
  // Add data rows
  data.forEach(item => {
    const row = columns.map(col => {
      if (col.render) {
        // If there's a render function, try to extract text content
        const rendered = col.render(item)
        if (typeof rendered === 'string' || typeof rendered === 'number') {
          return rendered
        }
        // For React components or complex objects, try to extract text
        if (rendered && typeof rendered === 'object' && rendered.props) {
          // Try to extract text from React elements
          return extractTextFromReactElement(rendered)
        }
        return String(rendered || '')
      } else {
        // Direct property access
        const value = getNestedValue(item, col.key)
        return value !== null && value !== undefined ? String(value) : ''
      }
    })
    excelData.push(row)
  })
  
  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(excelData)
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  // Write file
  XLSX.writeFile(workbook, filename)
}

/**
 * Helper function to get nested object values
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null
  }, obj)
}

/**
 * Helper function to extract text from React elements
 */
function extractTextFromReactElement(element: any): string {
  if (typeof element === 'string' || typeof element === 'number') {
    return String(element)
  }
  
  if (element && typeof element === 'object') {
    // Try to get text content from common patterns
    if (element.props) {
      if (element.props.children) {
        return extractTextFromReactElement(element.props.children)
      }
      // For badges or similar components, try to get the text content
      if (typeof element.props.children === 'string') {
        return element.props.children
      }
    }
  }
  
  return String(element || '')
}

/**
 * Helper function to create export columns from table columns
 */
export function createExportColumns(tableColumns: any[]): ExportColumn[] {
  return tableColumns
    .filter(col => col.key !== 'actions') // Exclude action columns
    .map(col => ({
      key: String(col.key),
      label: col.label,
      render: col.render
    }))
}