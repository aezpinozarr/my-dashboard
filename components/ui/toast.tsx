"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  open?: boolean
}

export function Toast({ title, description }: ToastProps) {
  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 w-80 rounded-md bg-white shadow-lg border p-4 animate-in slide-in-from-right duration-300"
      )}
    >
      {title && <div className="font-semibold">{title}</div>}
      {description && <div className="text-sm text-gray-600">{description}</div>}
    </div>
  )
}