import { Storage, StorageKey } from '@airgap/beacon-types'

export class StorageValidator {
  constructor(private readonly storage: Storage) {}

  private validateNumber(param: any) {
    return typeof param === 'number' && !isNaN(param)
  }

  private validateText(param: any) {
    return typeof param === 'string'
  }

  private validateBoolean(param: any) {
    return typeof param === 'boolean'
  }

  private validateArray(param: any) {
    return Array.isArray(param)
  }
  private objHasProperty(obj: any, path: string) {
    if (!obj) return false // Return false if the object is null or undefined

    const properties = path.split('.') // Split the path into individual properties

    let current = obj
    for (const property of properties) {
      // If the property doesn't exist, return false
      if (!current.hasOwnProperty(property)) {
        return false
      }
      // Move to the next level in the path
      current = current[property]
    }
    return true
  }

  private innerValidate(value: any, type: 'num' | 'str' | 'bol' | 'obj' | 'arr', prop?: string) {
    if (!value) {
      return true
    }

    switch (type) {
      case 'num':
        return this.validateNumber(value)
      case 'str':
        return this.validateText(value)
      case 'bol':
        return this.validateBoolean(value)
      case 'obj':
        return this.objHasProperty(value, prop!)
      case 'arr':
        return this.validateArray(value)
      default:
        return false
    }
  }

  async validate(): Promise<boolean> {
    if (!this.innerValidate(await this.storage.get(StorageKey.BEACON_SDK_VERSION), 'str')) {
      return false
    }
    if (!this.innerValidate(await this.storage.get(StorageKey.MATRIX_SELECTED_NODE), 'str')) {
      return false
    }
    if (!this.innerValidate(await this.storage.get(StorageKey.MULTI_NODE_SETUP_DONE), 'bol')) {
      return false
    }
    if (!this.innerValidate(await this.storage.get(StorageKey.TRANSPORT_P2P_PEERS_DAPP), 'arr')) {
      return false
    }
    if (!this.innerValidate(await this.storage.get(StorageKey.TRANSPORT_P2P_PEERS_WALLET), 'arr')) {
      return false
    }
    if (
      !this.innerValidate(
        await this.storage.get(StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP),
        'arr'
      )
    ) {
      return false
    }
    if (
      !this.innerValidate(
        await this.storage.get(StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET),
        'arr'
      )
    ) {
      return false
    }
    if (
      !this.innerValidate(
        await this.storage.get(StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP),
        'arr'
      )
    ) {
      return false
    }
    if (!this.innerValidate(await this.storage.get(StorageKey.ACCOUNTS), 'arr')) {
      return false
    }
    if (!this.innerValidate(await this.storage.get(StorageKey.APP_METADATA_LIST), 'arr')) {
      return false
    }
    if (!this.innerValidate(await this.storage.get(StorageKey.PERMISSION_LIST), 'arr')) {
      return false
    }
    if (!this.innerValidate(await this.storage.get(StorageKey.ACTIVE_ACCOUNT), 'str')) {
      return false
    }
    if (
      !this.innerValidate(await this.storage.get(StorageKey.LAST_SELECTED_WALLET), 'obj', 'key')
    ) {
      return false
    }

    return true
  }
}
