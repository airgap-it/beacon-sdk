export enum TezosSaplingPermissionScope {
  /**
   * The "viewing_key" permission is used to signal to the wallet that a dApp requests access to the viewing key. Sharing the viewing key will give up ALL privacy advantages of sapling, so this permission should only be granted in very specific cases.
   */
  'viewing_key' = 'viewing_key',
  /**
   * This permission allows wallets to do normal transfers from one sapling account to another.
   */
  'transfer' = 'transfer'
}
