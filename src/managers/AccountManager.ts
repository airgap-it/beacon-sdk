import { Storage, StorageKey, AccountInfo } from '..'

export class AccountManager {
  private readonly storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  public async getAccounts(): Promise<AccountInfo[]> {
    return this.storage.get(StorageKey.ACCOUNTS)
  }

  public async getAccount(accountIdentifier: string): Promise<AccountInfo | undefined> {
    const accounts = await this.storage.get(StorageKey.ACCOUNTS)

    return accounts.find((account) => account.accountIdentifier === accountIdentifier)
  }

  public async addAccount(accountInfo: AccountInfo): Promise<void> {
    const accounts = await this.storage.get(StorageKey.ACCOUNTS)

    if (!accounts.some((element) => element.accountIdentifier === accountInfo.accountIdentifier)) {
      accounts.push(accountInfo)
    }

    return this.storage.set(StorageKey.ACCOUNTS, accounts)
  }

  public async removeAccount(accountIdentifier: string): Promise<void> {
    const accounts = await this.storage.get(StorageKey.ACCOUNTS)

    const filteredAccounts = accounts.filter(
      (account) => account.accountIdentifier !== accountIdentifier
    )

    return this.storage.set(StorageKey.ACCOUNTS, filteredAccounts)
  }

  public async removeAccounts(accountIdentifiers: string[]): Promise<void> {
    const accounts = await this.storage.get(StorageKey.ACCOUNTS)

    const filteredAccounts = accounts.filter((account) =>
      accountIdentifiers.every(
        (accountIdentifier) => account.accountIdentifier !== accountIdentifier
      )
    )

    return this.storage.set(StorageKey.ACCOUNTS, filteredAccounts)
  }

  public async removeAllAccounts(): Promise<void> {
    return this.storage.delete(StorageKey.ACCOUNTS)
  }
}
