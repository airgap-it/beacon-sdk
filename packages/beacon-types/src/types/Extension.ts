export interface Extension {
  id: string
  name: string
  shortName?: string
  iconUrl?: string
  color?: string
  /**
   * Firefox extension ID. Used by dynamically detected extensions to enable
   * proper pairing on Firefox. When an extension responds to a ping with a
   * firefoxId in the sender object, it should be preserved here so the SDK
   * can send pairing messages to both the Chrome and Firefox extension IDs.
   */
  firefoxId?: string
}
