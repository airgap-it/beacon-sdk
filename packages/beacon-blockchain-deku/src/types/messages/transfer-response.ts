export type DekuTransferResponse =
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
