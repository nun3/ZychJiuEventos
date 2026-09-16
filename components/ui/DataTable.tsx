import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { cn } from './utils'

export type DataTableColumn<Row> = {
  key: string
  header: ReactNode
  render?: (row: Row, index: number) => ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

export type DataTableProps<Row> = {
  columns: Array<DataTableColumn<Row>>
  rows: Row[]
  getRowKey?: (row: Row, index: number) => string | number
  caption?: ReactNode
  emptyState?: ReactNode
  className?: string
  tableClassName?: string
}

const alignment: Record<NonNullable<DataTableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function DataTable<Row>({ columns, rows, getRowKey, caption, emptyState, className, tableClassName }: DataTableProps<Row>) {
  if (!rows.length) {
    return <div className={className}>{emptyState || <EmptyState title="Nenhum registro encontrado" />}</div>
  }

  return (
    <div className={cn('w-full overflow-x-auto rounded-mc-medium border border-mc-border bg-mc-surface', className)}>
      <table className={cn('w-full min-w-full border-collapse font-mc-interface text-sm', tableClassName)}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-mc-surface-secondary text-mc-text-secondary">
          <tr>
            {columns.map(column => <th key={column.key} scope="col" className={cn('px-4 py-3 font-semibold', alignment[column.align || 'left'], column.className)}>{column.header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-mc-border">
          {rows.map((row, index) => (
            <tr key={getRowKey?.(row, index) ?? index} className="text-mc-text-primary transition-colors duration-mc-fast hover:bg-mc-surface-secondary/70">
              {columns.map(column => <td key={column.key} className={cn('px-4 py-3 align-middle', alignment[column.align || 'left'], column.className)}>{column.render ? column.render(row, index) : String((row as Record<string, unknown>)[column.key] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
