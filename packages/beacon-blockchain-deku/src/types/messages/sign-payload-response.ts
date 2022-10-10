export type DekuSignPayloadResponse =
  | {
      transactionHash: string
    }
  | {
      transactionHash: string
      signature: string
      payload?: string
    }
  | {
      signature: string
      payload?: string
    }
