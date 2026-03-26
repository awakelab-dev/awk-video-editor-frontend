import { useCallback } from 'react'
import type { ElementLibraryItem } from '../types'

export type AddElementPayload = {
  template: ElementLibraryItem
}

/**
 * Emits a custom event so other features can listen without tight coupling.
 */
export function useAddElement() {
  return useCallback((item: ElementLibraryItem) => {
    const payload: AddElementPayload = { template: item }
    window.dispatchEvent(new CustomEvent('element-library:add', { detail: payload }))
  }, [])
}
