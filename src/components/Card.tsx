import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Removes the default surface fill (e.g. ghost/outlined cards). */
  ghost?: boolean
}

export function Card({ className = '', ghost = false, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-card border border-hairline ${ghost ? '' : 'bg-surface'} ${className}`}
      {...rest}
    />
  )
}
