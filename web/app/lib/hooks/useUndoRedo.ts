'use client'

import { useState, useCallback } from 'react'

type HistoryState<T> = {
  past: T[]
  present: T
  future: T[]
}

export function useUndoRedo<T>(initialValue: T, maxHistory = 50) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialValue,
    future: [],
  })

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  const undo = useCallback(() => {
    if (!canUndo) return

    setState((current) => {
      const previous = current.past[current.past.length - 1] as T
      const newPast = current.past.slice(0, current.past.length - 1)

      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      }
    })
  }, [canUndo])

  const redo = useCallback(() => {
    if (!canRedo) return

    setState((current) => {
      const next = current.future[0] as T
      const newFuture = current.future.slice(1)

      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      }
    })
  }, [canRedo])

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setState((current) => {
        const value = typeof newValue === 'function' 
          ? (newValue as (prev: T) => T)(current.present)
          : newValue

        const newPast = [...current.past, current.present].slice(-maxHistory)

        return {
          past: newPast,
          present: value,
          future: [], // Clear future when a new change is made
        }
      })
    },
    [maxHistory]
  )

  const reset = useCallback(
    (resetValue?: T) => {
      setState({
        past: [],
        present: resetValue !== undefined ? resetValue : initialValue,
        future: [],
      })
    },
    [initialValue]
  )

  return {
    state: state.present,
    setValue,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    history: {
      past: state.past,
      future: state.future,
    },
  }
}
