import { CHART_STATES, getValueColor, formatCompact } from '../theme'

export interface DataTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

export interface DataTableRow {
  id: string
  icon?: React.ReactNode
  cells: Record<string, string | number | React.ReactNode>
  valueForColoring?: number
}

export interface DataTableProps {
  columns: DataTableColumn[]
  data: DataTableRow[]
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  emptyIcon?: React.ReactNode
  colorValueColumn?: string
  valueFormatter?: (value: number) => string
}

export function DataTable({
  columns,
  data,
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  emptyIcon,
  colorValueColumn,
  valueFormatter = formatCompact,
}: DataTableProps) {
  if (isLoading) {
    return (
      <div className={`${CHART_STATES.loading.className} py-8`}>
        <div className={CHART_STATES.loading.textClassName}>{loadingText}</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={`${CHART_STATES.empty.className} flex-col gap-2 py-8`}>
        {emptyIcon && <div className="text-muted-foreground">{emptyIcon}</div>}
        <div className={CHART_STATES.empty.textClassName}>{emptyText}</div>
      </div>
    )
  }

  const getAlignment = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center'
      case 'right': return 'text-right'
      default: return 'text-left'
    }
  }

  return (
    <div className="w-full">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-2 px-3 text-xs font-medium text-muted-foreground ${getAlignment(col.align)}`}
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              {columns.map((col) => {
                const cellValue = row.cells[col.key]
                const isValueColumn = colorValueColumn === col.key
                const numericValue = typeof cellValue === 'number' ? cellValue : row.valueForColoring

                return (
                  <td
                    key={col.key}
                    className={`py-3 px-3 text-sm ${getAlignment(col.align)}`}
                    style={isValueColumn && numericValue !== undefined ? { color: getValueColor(numericValue) } : undefined}
                  >
                    {col.key === columns[0].key && row.icon ? (
                      <div className="flex items-center gap-2">
                        {row.icon}
                        <span>{cellValue}</span>
                      </div>
                    ) : (
                      typeof cellValue === 'number' ? valueFormatter(cellValue) : cellValue
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
