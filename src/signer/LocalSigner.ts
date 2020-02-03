import { Signer } from './Signer'

export class LocalSigner extends Signer {
  public async getAddresses(): Promise<string[]> {
    return ['']
  }
  public async sign(): Promise<string> {
    return ''
  }
}
