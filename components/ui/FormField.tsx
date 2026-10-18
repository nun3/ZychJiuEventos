import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { cn } from './utils'

type FieldElementProps = {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export type FormFieldProps = {
  id: string
  label: ReactNode
  children: ReactElement<FieldElementProps>
  description?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
}

export function FormField({ id, label, children, description, error, required, className }: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined
  const field = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id || id,
        'aria-describedby': [children.props['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? true : children.props['aria-invalid'],
      })
    : children

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline gap-1">
        <label htmlFor={id} className="font-mc-interface text-sm font-semibold text-mc-text-primary">
          {label}
        </label>
        {required ? <span aria-hidden="true" className="text-mc-error">*</span> : null}
      </div>
      {field}
      {description && <p id={descriptionId} className="font-mc-interface text-sm text-mc-text-secondary">{description}</p>}
      {error && <p id={errorId} className="font-mc-interface text-sm text-mc-error">{error}</p>}
    </div>
  )
}
