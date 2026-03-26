export type InstrumentationEvent = 'text_add_clicked' | 'text_preset_added' | 'library_item_added'

export function useInstrumentation() {
  function trackEvent(event: InstrumentationEvent, payload?: Record<string, unknown>) {
    console.log('[instrumentation]', event, payload)
  }

  return { trackEvent }
}
