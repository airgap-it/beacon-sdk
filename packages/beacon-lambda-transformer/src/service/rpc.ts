import Axios from 'axios'

import type { MichelsonJSON } from 'src/typings'

export class RpcClient {
  constructor(private endpoint: string) {}

  public async getEntrypointType(address: string, entrypoint?: string): Promise<MichelsonJSON> {
    return (
      await Axios.get<MichelsonJSON>(
        `${this.endpoint}/chains/main/blocks/head/context/contracts/${address}/entrypoints/${
          entrypoint || 'default'
        }`
      )
    ).data
  }
}
