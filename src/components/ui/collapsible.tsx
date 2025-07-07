"use client"

import * as React from "react"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Collapsible({ open: controlledOpen, onOpenChange, children }: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  
  const handleOpenChange = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  return (
    <div data-open={isOpen}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === CollapsibleTrigger) {
            return React.cloneElement(child, { onToggle: () => handleOpenChange(!isOpen) })
          }
          if (child.type === CollapsibleContent) {
            return React.cloneElement(child, { isOpen })
          }
        }
        return child
      })}
    </div>
  )
}

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onToggle?: () => void
}

export function CollapsibleTrigger({ onToggle, onClick, ...props }: CollapsibleTriggerProps) {
  return (
    <button
      {...props}
      onClick={(e) => {
        onToggle?.()
        onClick?.(e)
      }}
    />
  )
}

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean
}

export function CollapsibleContent({ isOpen, children, ...props }: CollapsibleContentProps) {
  if (!isOpen) return null
  
  return (
    <div {...props}>
      {children}
    </div>
  )
} 