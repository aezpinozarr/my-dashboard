"use client"

import * as React from "react"
import { type ToastProps } from "./toast"

export type ToastActionElement = React.ReactNode

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 2000 // 2 segundos

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

export const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export function useToast() {
  const [state, dispatch] = React.useReducer(
    (state: ToasterToast[], action: any) => {
      switch (action.type) {
        case actionTypes.ADD_TOAST:
          return [action.toast, ...state].slice(0, TOAST_LIMIT)
        case actionTypes.UPDATE_TOAST:
          return state.map((t) =>
            t.id === action.toast.id ? { ...t, ...action.toast } : t
          )
        case actionTypes.DISMISS_TOAST: {
          return state.map((t) =>
            t.id === action.toast.id ? { ...t, open: false } : t
          )
        }
        case actionTypes.REMOVE_TOAST:
          return state.filter((t) => t.id !== action.toast.id)
        default:
          return state
      }
    },
    []
  )

  const addToast = React.useCallback((toast: Omit<ToasterToast, "id">) => {
    const id = genId()
    dispatch({ type: actionTypes.ADD_TOAST, toast: { ...toast, id, open: true } })

    const timeout = setTimeout(() => {
      dispatch({ type: actionTypes.REMOVE_TOAST, toast: { id } })
    }, TOAST_REMOVE_DELAY)
    toastTimeouts.set(id, timeout)

    return id
  }, [])

  const dismiss = React.useCallback((id: string) => {
    dispatch({ type: actionTypes.DISMISS_TOAST, toast: { id } })
  }, [])

  return {
    addToast,
    dismiss,
    toasts: state,
  }
}