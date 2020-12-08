import { DAppClient, ErrorResponse, BroadcastResponseOutput } from '..' // Replace '..' with '@airgap/beacon-sdk'

const client = new DAppClient({ name: 'My Sample DApp' })

client
  .requestBroadcast({
    // a valid, forged and signed transaction
    signedTransaction:
      '1ef017b560494ae7b102be63f4d64e64d70114ff4652df23f34ae4460645b3266b00641b67c32672f0b11263b89b05b51e42faa64a3f940ad8d79101904e0000c64ac48e550c2c289af4c5ce5fe52ca7ba7a91d1a411745313e154eff8d118f16c00641b67c32672f0b11263b89b05b51e42faa64a3fdc0bd9d79101bc5000000000641b67c32672f0b11263b89b05b51e42faa64a3f0085dcfbba4a00c5b4f89914c1819ccd8466f6328b74073d50406394e59fe32d89e62112fec2d5a9bc1e6787206fe50e26f90999ae3061ca76247b57e08b6e490a'
  })
  .then((response: BroadcastResponseOutput) => {
    console.log('transaction hash', response.transactionHash)
  })
  .catch((broadcastError: ErrorResponse) => console.log(broadcastError))
