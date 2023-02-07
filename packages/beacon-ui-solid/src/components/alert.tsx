import { Component } from 'solid-js'
import { NetworkType, P2PPairingRequest, PostMessagePairingRequest } from '@airgap/beacon-types'

export interface AlertProps {}

const Alert: Component<AlertProps> = (props: AlertProps) => {
  return (
    <div>
      <h1>Alert Component</h1>
    </div>
  )
}

export default Alert

export interface AlertButton {
  text: string
  style?: 'solid' | 'outline'
  actionCallback?(): Promise<void>
}

export interface AlertConfig {
  title: string
  body?: string
  data?: string
  timer?: number
  buttons?: AlertButton[]
  pairingPayload?: {
    p2pSyncCode: () => Promise<P2PPairingRequest>
    postmessageSyncCode: () => Promise<PostMessagePairingRequest>
    preferredNetwork: NetworkType
  }
  closeButtonCallback?(): void
  disclaimerText?: string
}

/**
 * Close an alert by ID
 *
 * @param id ID of alert
 */
const closeAlert = (id: string): Promise<void> => {
  console.log('closeAlert', id)
  return new Promise(async (resolve) => {
    resolve()
  })
}

/**
 * Close all alerts
 */
const closeAlerts = async (): Promise<void> =>
  new Promise(async (resolve) => {
    console.log('closeAlerts')
    resolve()
  })

/**
 * Show an alert
 *
 * @param alertConfig The configuration of the alert
 */
// eslint-disable-next-line complexity
const openAlert = async (alertConfig: AlertConfig): Promise<string> => {
  console.log('openAlert')
  return ''
}

export { closeAlert, closeAlerts, openAlert }
