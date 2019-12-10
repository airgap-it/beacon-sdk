import * as sodium from 'libsodium-wrappers'
import * as matrixsdk from 'matrix-js-sdk'

interface Member {
  membership: string
  roomId: string
  userId: string
}

interface Room {
  roomId: string
  room_id: string
  currentState: any
}

// enum InteractionMessageType {
//   MESSAGE = 'message',
//   CHANNEL_OPEN = 'channel_open'
// }

function toHex(value: any): string {
  return Buffer.from(value).toString('hex')
}

function getHexHash(key: string | Buffer | Uint8Array): string {
  return toHex(sodium.crypto_generichash(32, key))
}

function getKeypairFromSeed(seed: string): sodium.KeyPair {
  return sodium.crypto_sign_seed_keypair(sodium.crypto_generichash(32, sodium.from_string(seed)))
}

function encryptCryptoboxPayload(message: string, sharedKey: Uint8Array): string {
  const nonce = Buffer.from(sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES))
  const combinedPayload = Buffer.concat([nonce, Buffer.from(sodium.crypto_secretbox_easy(Buffer.from(message, 'utf8'), nonce, sharedKey))])

  console.log('nonce', nonce)
  console.log('combinedPayload', toHex(combinedPayload))

  return toHex(combinedPayload)
}

function decryptCryptoboxPayload(payload: Uint8Array, sharedKey: Uint8Array): string {
  console.log('ciphertext', toHex(payload))

  const nonce = payload.slice(0, sodium.crypto_secretbox_NONCEBYTES)
  const ciphertext = payload.slice(sodium.crypto_secretbox_NONCEBYTES)

  console.log('nonce', toHex(nonce))

  return Buffer.from(sodium.crypto_secretbox_open_easy(ciphertext, nonce, sharedKey)).toString('utf8')
}

// function assertNever(_: never) {}

// function getMessageString(type: InteractionMessageType, message: string): string {
//   const MESSAGE_PREFIX = '@'
//   const CHANNEL_OPEN = `@channel_open:{recipient}:{encryptedPubkey}`
//   switch (type) {
//     case InteractionMessageType.MESSAGE:
//       return `@m:${message}`
//     case InteractionMessageType.CHANNEL_OPEN:
//       return `@channel_open:${message}`
//     default:
//       assertNever(type)
//       return ``
//   }
// }

function recipientString(recipientHash: string, relayServer: string): string {
  return '@' + recipientHash + ':' + relayServer
}

export class WalletCommunicationClient {
  private keyPair: sodium.KeyPair | undefined
  private clients: any[] = []

  private KNOWN_RELAY_SERVERS = [
    'matrix.papers.tech'
    // 'matrix.tez.ie'
    // 'matrix-dev.papers.tech'
    // "matrix.stove-labs.com",
    // "yadayada.cryptonomic-infra.tech"
  ]

  constructor(
    private readonly name: string,
    private readonly privateSeed: string,
    public readonly replicationCount: number,
    private readonly debug: boolean = false
  ) {}

  private bigIntAbsolute(inputBigInt: any): BigInt {
    if (inputBigInt < 0n) {
      return inputBigInt * -1n
    } else {
      return inputBigInt
    }
  }

  private getAbsoluteBigIntDifference(firstHash: string, secondHash: string): BigInt {
    let difference = BigInt('0x' + firstHash) - BigInt('0x' + secondHash)
    return this.bigIntAbsolute(difference)
  }

  public getHandshakeInfo(): { pubKey: string; relayServer: string } {
    return {
      pubKey: this.getPublicKey(),
      relayServer: this.getRelayServer()
    }
  }

  public getRelayServer(publicKeyHash?: string, nonce: string = ''): string {
    if (!this.keyPair) {
      throw new Error('KeyPair not available')
    }
    const hash: string = publicKeyHash || getHexHash(this.keyPair.publicKey)
    return this.KNOWN_RELAY_SERVERS.reduce((prev, curr) => {
      const prevRelayServerHash = getHexHash(prev + nonce)
      const currRelayServerHash = getHexHash(curr + nonce)
      return this.getAbsoluteBigIntDifference(hash, prevRelayServerHash) < this.getAbsoluteBigIntDifference(hash, currRelayServerHash)
        ? prev
        : curr
    })
  }

  public async start() {
    this.log('starting client')
    await sodium.ready
    const keyPair: sodium.KeyPair = getKeypairFromSeed(this.privateSeed)
    this.keyPair = keyPair

    const loginRawDigest = sodium.crypto_generichash(32, sodium.from_string('login:' + Math.floor(Date.now() / 1000 / (5 * 60))))
    const rawSignature = sodium.crypto_sign_detached(loginRawDigest, this.keyPair.privateKey)

    this.log(`connecting to ${this.replicationCount} servers`)

    for (let i = 0; i < this.replicationCount; i++) {
      const client = matrixsdk.createClient({
        baseUrl: 'https://' + this.getRelayServer(this.getPublicKeyHash(), i.toString()),
        deviceId: toHex(this.keyPair.publicKey),
        timelineSupport: false
      })

      this.log('login', this.getPublicKeyHash(), 'on', this.getRelayServer(this.getPublicKeyHash(), i.toString()))
      await client.login('m.login.password', {
        user: this.getPublicKeyHash(),
        password: 'ed:' + toHex(rawSignature) + ':' + this.getPublicKey()
      })
      client.on('RoomMember.membership', async (_event: any, member: Member) => {
        if (member.membership === 'invite') {
          await client.joinRoom(member.roomId)
        }
      })
      await client.startClient({ initialSyncLimit: 0 })
      for (const room of client.getRooms()) {
        if (room.getMyMembership() === 'invite') {
          await client.joinRoom(room.roomId)
        }
      }
      this.clients.push(client)
    }
  }

  public getPublicKey(): string {
    if (!this.keyPair) {
      throw new Error('KeyPair not available')
    }
    return toHex(this.keyPair.publicKey)
  }

  public getPublicKeyHash(): string {
    if (!this.keyPair) {
      throw new Error('KeyPair not available')
    }
    return getHexHash(this.keyPair.publicKey)
  }

  private async createCryptoBox(otherPublicKey: string, selfPrivateKey: Uint8Array): Promise<[Uint8Array, Uint8Array, Uint8Array]> {
    // TODO: Don't calculate it every time?
    const kxSelfPrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(Buffer.from(selfPrivateKey)) //secret bytes to scalar bytes
    const kxSelfPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(selfPrivateKey).slice(32, 64)) //secret bytes to scalar bytes
    const kxOtherPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(otherPublicKey, 'hex')) //secret bytes to scalar bytes

    return [Buffer.from(kxSelfPublicKey), Buffer.from(kxSelfPrivateKey), Buffer.from(kxOtherPublicKey)]
  }

  private async createCryptoBoxServer(otherPublicKey: string, selfPrivateKey: Uint8Array): Promise<sodium.CryptoKX> {
    const keys = await this.createCryptoBox(otherPublicKey, selfPrivateKey)
    return sodium.crypto_kx_server_session_keys(...keys)
  }

  private async createCryptoBoxClient(otherPublicKey: string, selfPrivateKey: Uint8Array): Promise<sodium.CryptoKX> {
    const keys = await this.createCryptoBox(otherPublicKey, selfPrivateKey)
    return sodium.crypto_kx_client_session_keys(...keys)
  }

  public async listenForEncryptedMessage(senderPublicKey: string, messageCallback: (message: string) => void) {
    if (!this.keyPair) {
      throw new Error('KeyPair not available')
    }

    const { sharedRx } = await this.createCryptoBoxServer(senderPublicKey, this.keyPair.privateKey)

    for (let client of this.clients) {
      client.on('event', (event: any) => {
        if (event.getType() === 'm.room.message' && event.getSender().startsWith('@' + getHexHash(Buffer.from(senderPublicKey, 'hex')))) {
          let payload = Buffer.from(event.getContent().body, 'hex')
          if (payload.length >= sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
            messageCallback(decryptCryptoboxPayload(payload, sharedRx))
          }
        }
      })
    }
  }

  public async sendMessage(recipientPublicKey: string, message: string) {
    if (!this.keyPair) {
      throw new Error('KeyPair not available')
    }
    const { sharedTx } = await this.createCryptoBoxClient(recipientPublicKey, this.keyPair.privateKey)

    for (let i = 0; i < this.replicationCount; i++) {
      const recipientHash = getHexHash(Buffer.from(recipientPublicKey, 'hex'))
      const recipient = recipientString(recipientHash, this.getRelayServer(recipientHash, i.toString()))

      for (let client of this.clients) {
        const room = await this.getRelevantRoom(client, recipient)

        client.sendMessage(room.roomId, {
          msgtype: 'm.text',
          body: encryptCryptoboxPayload(message, sharedTx)
        })
      }
    }
  }

  public async listenForChannelOpening(messageCallback: (message: string) => void) {
    if (!this.keyPair) {
      throw new Error('KeyPair not available')
    }

    for (let client of this.clients) {
      client.on('event', (event: any) => {
        if (
          event.getType() === 'm.room.message' &&
          event.getContent().body.startsWith('@channel-open:@' + getHexHash(Buffer.from(this.getPublicKey(), 'hex')))
        ) {
          if (!this.keyPair) {
            throw new Error('KeyPair not available')
          }
          this.log('new channel open event!')

          const splits = event.getContent().body.split(':')
          const payload = Buffer.from(splits[splits.length - 1], 'hex')

          if (payload.length >= sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
            messageCallback(decryptCryptoboxPayload(payload, this.keyPair.publicKey))
          }
        }
      })
    }
  }

  public async openChannel(recipientPublicKey: string, relayServer: string) {
    this.log('open channel')
    const recipientHash = getHexHash(Buffer.from(recipientPublicKey, 'hex'))
    const recipient = recipientString(recipientHash, relayServer)

    this.log('currently there are ' + this.clients.length + ' clients open')
    for (let client of this.clients) {
      const room = await this.getRelevantRoom(client, recipient)

      client.sendMessage(room.roomId, {
        msgtype: 'm.text',
        body: '@channel-open:' + recipient + ':' + encryptCryptoboxPayload(this.getPublicKey(), Buffer.from(recipientPublicKey, 'hex'))
      })
    }
  }

  private async getRelevantRoom(client: any, recipient: string): Promise<Room> {
    const rooms = client.getRooms()
    const relevantRooms = rooms.filter((room: Room) => {
      return room.currentState.getMembers().some((member: Member) => {
        return member.userId === recipient
      })
    })

    let room: Room
    if (relevantRooms.length == 0) {
      this.log(`no relevant rooms found`)

      room = await client.createRoom({
        invite: [recipient],
        preset: 'trusted_private_chat',
        is_direct: true
      })
      room = client.getRoom(room.room_id)
    } else {
      room = relevantRooms[0]
      this.log(`channel already open, reusing room ${room.roomId}`)
    }

    return room
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log(`--- [WalletCommunicationClient]:${this.name}: `, ...args)
    }
  }
}
