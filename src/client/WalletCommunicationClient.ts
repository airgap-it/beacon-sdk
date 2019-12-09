import * as sodium from 'libsodium-wrappers'
import * as matrixsdk from 'matrix-js-sdk'

interface Member {
  membership: string
  roomId: string
  userId: string
}

interface Room {
  currentState: any
}

interface KeyPair {
  publicKey: string
  privateKey: string
}

function getHexHash(key: string | Buffer): string {
  return Buffer.from(sodium.crypto_generichash(32, key)).toString('hex')
}

export class WalletCommunicationClient {
  private keyPair: KeyPair | undefined
  private clients: any[] = []

  private KNOWN_RELAY_SERVERS = [
    'matrix.papers.tech',
    'matrix.tez.ie',
    'matrix-dev.papers.tech'
    //"matrix.stove-labs.com",
    //"yadayada.cryptonomic-infra.tech"
  ]

  constructor(private readonly privateSeed: string = 'secret', public readonly replicationCount: number = 3) {}

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
    await sodium.ready
    const keyPair: KeyPair = sodium.crypto_sign_seed_keypair(sodium.crypto_generichash(32, sodium.from_string(this.privateSeed)))
    this.keyPair = keyPair

    const publicKeyRawDigest = sodium.crypto_generichash(32, Buffer.from(this.keyPair.publicKey))
    const loginRawDigest = sodium.crypto_generichash(32, sodium.from_string('login:' + Math.floor(Date.now() / 1000 / (5 * 60))))
    const rawSignature = sodium.crypto_sign_detached(loginRawDigest, this.keyPair.privateKey)

    //for (let i = 0; i < this.replicationCount; i++) {
    const client = matrixsdk.createClient({
      baseUrl: 'https://' + this.getRelayServer(getHexHash(this.keyPair.publicKey), '0'),
      deviceId: Buffer.from(this.keyPair.publicKey).toString('hex'),
      timelineSupport: false
    })

    console.log(
      'login',
      Buffer.from(publicKeyRawDigest).toString('hex'),
      'on',
      this.getRelayServer(getHexHash(this.keyPair.publicKey), '0')
    )
    await client.login('m.login.password', {
      user: Buffer.from(publicKeyRawDigest).toString('hex'),
      password: 'ed:' + Buffer.from(rawSignature).toString('hex') + ':' + Buffer.from(this.keyPair.publicKey).toString('hex')
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

    //}
  }

  public getPublicKey(): string {
    if (!this.keyPair) {
      throw new Error('KeyPair not available')
    }
    return Buffer.from(this.keyPair.publicKey).toString('hex')
  }

  public getPublicKeyHash(): string {
    if (!this.keyPair) {
      throw new Error('KeyPair not available')
    }
    return getHexHash(this.keyPair.publicKey)
  }

  public async listenForEncryptedMessage(senderPublicKey: string, messageCallback: (message: string) => void) {
    if (!this.keyPair) {
      throw new Error('KeyPair not available')
    }
    const kxSelfPrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(Buffer.from(this.keyPair.privateKey)) //secret bytes to scalar bytes
    const kxSelfPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(this.keyPair.privateKey).slice(32, 64)) //secret bytes to scalar bytes
    const kxOtherPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(senderPublicKey, 'hex')) //secret bytes to scalar bytes
    const clientOut = sodium.crypto_kx_server_session_keys(
      Buffer.from(kxSelfPublicKey),
      Buffer.from(kxSelfPrivateKey),
      Buffer.from(kxOtherPublicKey)
    )

    for (let client of this.clients) {
      client.on('event', (event: any) => {
        if (event.getType() === 'm.room.message' && event.getSender().startsWith('@' + getHexHash(Buffer.from(senderPublicKey, 'hex')))) {
          let payload = Buffer.from(event.getContent().body, 'hex')
          if (payload.length >= sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
            let nonce = payload.slice(0, sodium.crypto_secretbox_NONCEBYTES),
              ciphertext = payload.slice(sodium.crypto_secretbox_NONCEBYTES)
            messageCallback(Buffer.from(sodium.crypto_secretbox_open_easy(ciphertext, nonce, clientOut.sharedRx)).toString('utf8'))
          }
        }
      })
    }
  }

  public async sendMessage(recipientPublicKey: string, message: string) {
    if (!this.keyPair) {
      throw new Error('KeyPair not available')
    }
    const kxSelfPrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(Buffer.from(this.keyPair.privateKey)) //secret bytes to scalar bytes
    const kxSelfPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(this.keyPair.privateKey).slice(32, 64)) //secret bytes to scalar bytes
    const kxOtherPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(recipientPublicKey, 'hex')) //secret bytes to scalar bytes

    let clientOut = sodium.crypto_kx_client_session_keys(
      Buffer.from(kxSelfPublicKey),
      Buffer.from(kxSelfPrivateKey),
      Buffer.from(kxOtherPublicKey)
    )

    //for (let i = 0; i < this.replicationCount; i++) {
    const recipientHash = getHexHash(Buffer.from(recipientPublicKey, 'hex'))
    const recipient = '@' + recipientHash + ':' + this.getRelayServer(recipientHash, '0')
    for (let client of this.clients) {
      const rooms = client.getRooms()

      const relevantRooms = rooms.filter((room: Room) => {
        return (
          room.currentState.getMembers().filter((member: Member) => {
            return member.userId === recipient
          }).length > 0
        )
      })

      let room
      if (relevantRooms.length == 0) {
        console.log(this.privateSeed + 'no relevance')

        room = await client.createRoom({
          invite: [recipient],
          preset: 'trusted_private_chat',
          is_direct: true
        })
        room = client.getRoom(room.room_id)
      } else {
        console.log(this.privateSeed + 'reusing')
        room = relevantRooms[0]
      }

      let nonce = Buffer.from(sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES))
      let combinedPayload = Buffer.concat([
        nonce,
        Buffer.from(sodium.crypto_secretbox_easy(Buffer.from(message, 'utf8'), nonce, clientOut.sharedTx))
      ])
      client.sendMessage(room.roomId, { msgtype: 'm.text', body: Buffer.from(combinedPayload).toString('hex') })
    }
    //}
  }
}
