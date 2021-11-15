import { Transport } from '@airgap/beacon-core'

export class MockTransport extends Transport {
  public async listen() {}
}
