import { useState, useCallback } from 'react'

type OptimisticUpdateOptions<T> = {
  initialData: T[]
  onUpdate: (item: T) => Promise<T>
  onDelete: (id: string) => Promise<void>
  onAdd: (item: Partial<T>) => Promise<T>
  getId: (item: T) => string
}

export function useOptimisticUpdate<T>({
  initialData,
  onUpdate,
  onDelete,
  onAdd,
  getId
}: OptimisticUpdateOptions<T>) {
  const [data, setData] = useState<T[]>(initialData)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const addItem = useCallback(async (item: Partial<T>) => {
    const tempId = `temp-${Date.now()}`
    const tempItem = { ...item, id: tempId } as T
    
    // 낙관적 업데이트
    setData(prev => [...prev, tempItem])
    setPendingIds(prev => new Set(prev).add(tempId))

    try {
      const newItem = await onAdd(item)
      setData(prev => prev.map(item => getId(item) === tempId ? newItem : item))
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(tempId)
        return next
      })
      return newItem
    } catch (error) {
      // 롤백
      setData(prev => prev.filter(item => getId(item) !== tempId))
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(tempId)
        return next
      })
      throw error
    }
  }, [onAdd, getId])

  const updateItem = useCallback(async (item: T) => {
    const id = getId(item)
    
    // 낙관적 업데이트
    setData(prev => prev.map(i => getId(i) === id ? item : i))
    setPendingIds(prev => new Set(prev).add(id))

    try {
      const updated = await onUpdate(item)
      setData(prev => prev.map(i => getId(i) === id ? updated : i))
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      return updated
    } catch (error) {
      // 롤백을 위해 원본 데이터 다시 로드 필요
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      throw error
    }
  }, [onUpdate, getId])

  const deleteItem = useCallback(async (id: string) => {
    const item = data.find(i => getId(i) === id)
    if (!item) return

    // 낙관적 업데이트
    setData(prev => prev.filter(i => getId(i) !== id))
    setPendingIds(prev => new Set(prev).add(id))

    try {
      await onDelete(id)
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (error) {
      // 롤백
      if (item) {
        setData(prev => [...prev, item])
      }
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      throw error
    }
  }, [data, onDelete, getId])

  return {
    data,
    pendingIds,
    addItem,
    updateItem,
    deleteItem,
    setData
  }
}
