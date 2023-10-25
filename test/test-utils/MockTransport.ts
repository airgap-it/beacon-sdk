import { Transport } from '@mavrykdynamics/beacon-core'

export class MockTransport extends Transport {
  public async listen() {}
}
