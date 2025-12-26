export type TableColumnType =
  | 'date'
  | 'datetime'
  | 'amount'
  | 'status'
  | 'wallet'
  | 'number'
  | 'id'
  | 'actions'
  | 'name'
  | 'email'
  | 'short-text'
  | 'medium-text'
  | 'long-text'
  | 'badge'
  | 'avatar'
  | 'checkbox'
  | 'icon';
export const COLUMN_TYPE_WIDTHS: Record<TableColumnType, string> = {
  'date': '110px',
  'datetime': '150px',
  'amount': '120px',
  'status': '100px',
  'wallet': '140px',
  'number': '80px',
  'id': '100px',
  'actions': '48px',
  'name': '200px',
  'email': '200px',
  'short-text': '140px',
  'medium-text': '180px',
  'long-text': 'minmax(200px, 1fr)',
  'badge': '120px',
  'avatar': '48px',
  'checkbox': '40px',
  'icon': '40px',
};
export const DEFAULT_COLUMN_TYPE: TableColumnType = 'short-text';
export function getColumnWidth(type?: TableColumnType): string {
  if (!type) return COLUMN_TYPE_WIDTHS[DEFAULT_COLUMN_TYPE];
  return COLUMN_TYPE_WIDTHS[type] || COLUMN_TYPE_WIDTHS[DEFAULT_COLUMN_TYPE];
}
export function buildGridTemplateColumns(
  columnTypes: (TableColumnType | undefined)[],
  options?: {
    selectable?: boolean;
    hasActions?: boolean;
  }
): string {
  const parts: string[] = [];
  
  if (options?.selectable) {
    parts.push(COLUMN_TYPE_WIDTHS['checkbox']);
  }
  
  const columnWidths = columnTypes.map(type => getColumnWidth(type));
  const hasFlexibleColumn = columnWidths.some(w => w.includes('1fr'));
  
  if (!hasFlexibleColumn && columnWidths.length > 0) {
    const lastIndex = columnWidths.length - 1;
    columnWidths[lastIndex] = `minmax(${columnWidths[lastIndex]}, 1fr)`;
  }
  
  parts.push(...columnWidths);
  
  if (options?.hasActions) {
    parts.push(COLUMN_TYPE_WIDTHS['actions']);
  }
  
  return parts.join('');
}
