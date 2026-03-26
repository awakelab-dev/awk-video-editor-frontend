export type InstrumentationEvent = 'text_add_clicked'

export function useInstrumentation() {
  function trackEvent(event: InstrumentationEvent, payload?: Record<string, unknown>) {
    console.log('[instrumentation]', event, payload)
  }

  return { trackEvent }
}
