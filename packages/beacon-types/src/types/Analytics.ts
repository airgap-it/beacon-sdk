export interface Analytics {
  track(eventType: 'click', section: string, label: string, link: string): void
}
