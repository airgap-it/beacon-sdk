export interface AnalyticsInterface {
  track(
    trigger: 'click' | 'event',
    section: string,
    label: string,
    data?: Record<string, any>
  ): void
}
