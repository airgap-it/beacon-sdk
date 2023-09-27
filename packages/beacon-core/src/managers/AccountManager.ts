import { Storage, StorageKey, AccountInfo, BeaconMessage } from '@airgap/beacon-types'
import { StorageManager } from './StorageManager'
import { PermissionValidator } from './PermissionValidator'

/**
 * @internalapi
 *
 * The AccountManager provides CRUD functionality for account entities and persists them to the provided storage.
 */
export class AccountManager {
  private readonly storageManager: StorageManager<StorageKey.ACCOUNTS>

  constructor(storage: Storage) {
    this.storageManager = new StorageManager(storage, StorageKey.ACCOUNTS)
  }

  public async getAccounts(): Promise<AccountInfo[]> {
    return await this.storageManager.getAll() ?? []
  }

  public async getAccount(accountIdentifier: string): Promise<AccountInfo | undefined> {
    return this.storageManager.getOne((account) => account.accountIdentifier === accountIdentifier)
  }

  public async addAccount(accountInfo: AccountInfo): Promise<void> {
    return this.storageManager.addOne(
      accountInfo,
      (account) => account.accountIdentifier === accountInfo.accountIdentifier
    )
  }

  public async updateAccount(
    accountIdentifier: string,
    accountInfo: Partial<AccountInfo>
  ): Promise<AccountInfo | undefined> {
    const account = await this.getAccount(accountIdentifier)

    if (!account) return undefined

    const newAccount = { ...account, ...accountInfo }
    await this.storageManager.addOne(
      newAccount,
      (account) => account.accountIdentifier === accountIdentifier,
      true
    )

    return newAccount
  }

  public async removeAccount(accountIdentifier: string): Promise<void> {
    return this.storageManager.remove((account) => account.accountIdentifier === accountIdentifier)
  }

  public async removeAccounts(accountIdentifiers: string[]): Promise<void> {
    return this.storageManager.remove((account) =>
      accountIdentifiers.includes(account.accountIdentifier)
    )
  }

  public async removeAllAccounts(): Promise<void> {
    return this.storageManager.removeAll()
  }

  public async hasPermission(message: BeaconMessage): Promise<boolean> {
    return PermissionValidator.hasPermission(
      message,
      this.getAccount.bind(this),
      this.getAccounts.bind(this)
    )
  }
}
