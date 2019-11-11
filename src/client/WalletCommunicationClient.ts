import * as sodium from 'libsodium-wrappers'
import * as matrixsdk from 'matrix-js-sdk'

export class WalletCommunicationClient {

    private keyPair: any;
    private client: any;

    constructor(
        public privateSeed = 'https://tezos-node.prod.gke.papers.tech',
        public p2pEntrypoint = 'http://localhost:8008/'
    ) {

    }

    public async start() {
        await sodium.ready
        this.keyPair = sodium.crypto_sign_seed_keypair(sodium.crypto_generichash(32, sodium.from_string(this.privateSeed)))

        const publicKeyRawDigest = sodium.crypto_generichash(32, Buffer.from(this.keyPair.publicKey))
        const loginRawDigest = sodium.crypto_generichash(32, sodium.from_string("login:" + Math.floor((Date.now() / 1000) / (5 * 60))))
        const rawSignature = sodium.crypto_sign_detached(loginRawDigest, this.keyPair.privateKey)

        this.client = matrixsdk.createClient({
            baseUrl: this.p2pEntrypoint,
            deviceId: Buffer.from(this.keyPair.publicKey).toString("hex")
        })

        await this.client.login("m.login.password", { "user": Buffer.from(publicKeyRawDigest).toString("hex"), "password": "ed:" + Buffer.from(rawSignature).toString("hex") + ":" + Buffer.from(this.keyPair.publicKey).toString("hex") })
        console.log('starting client')

        this.client.on("RoomMember.membership", async (event, member) => {
            if (member.membership === "invite" && member.userId === "@" + Buffer.from(publicKeyRawDigest).toString("hex") + ":matrix.papers.tech") {
                console.log("joined")
                await this.client.joinRoom(member.roomId)
            }
        })
        await this.client.startClient()

        for (const room of this.client.getRooms()) {
            if (room.getMyMembership() === 'invite') {
                await this.client.joinRoom(room.roomId)
            }
        }

    }

    public getPublicKey(): string {
        return Buffer.from(this.keyPair.publicKey).toString("hex")
    }

    public async listenForEncryptedMessage(senderPublicKey: string, messageCallback: (message: string) => void) {
        const kxSelfPrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(Buffer.from(this.keyPair.privateKey)) //secret bytes to scalar bytes
        const kxSelfPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(this.keyPair.privateKey).slice(32, 64)) //secret bytes to scalar bytes
        const kxOtherPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(senderPublicKey, "hex")) //secret bytes to scalar bytes
        let clientOut = sodium.crypto_kx_server_session_keys(Buffer.from(kxSelfPublicKey), Buffer.from(kxSelfPrivateKey), Buffer.from(kxOtherPublicKey))

        this.client.on("event", (event: any) => {
            if (event.getType() === "m.room.message") {
                let payload = Buffer.from(event.getContent().body, "hex")
                if (payload.length >= sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
                    let nonce = payload.slice(0, sodium.crypto_secretbox_NONCEBYTES),
                        ciphertext = payload.slice(sodium.crypto_secretbox_NONCEBYTES)
                    messageCallback(Buffer.from(sodium.crypto_secretbox_open_easy(ciphertext, nonce, clientOut.sharedRx)).toString('utf8'));
                }
            }
        })
    }

    public async sendMessage(recipientPublicKey: string, message: string) {
        const recipientPublicKeyRawDigest = sodium.crypto_generichash(32, Buffer.from(recipientPublicKey, "hex"))
        const kxSelfPrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(Buffer.from(this.keyPair.privateKey)) //secret bytes to scalar bytes
        const kxSelfPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(this.keyPair.privateKey).slice(32, 64)) //secret bytes to scalar bytes
        const kxOtherPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(recipientPublicKey, "hex")) //secret bytes to scalar bytes

        let clientOut = sodium.crypto_kx_client_session_keys(Buffer.from(kxSelfPublicKey), Buffer.from(kxSelfPrivateKey), Buffer.from(kxOtherPublicKey))

        const rooms = this.client.getRooms()
        const relevantRooms = rooms.filter(room => {
            return room.getDMInviter() === "@" + Buffer.from(recipientPublicKeyRawDigest).toString("hex") + ":matrix.papers.tech"
        })

        let room
        if (relevantRooms.length == 0) {
            room = await this.client.createRoom({
                invite: ["@" + Buffer.from(recipientPublicKeyRawDigest).toString("hex") + ":matrix.papers.tech"],
                preset: "trusted_private_chat",
                is_direct: true
            })
            room = this.client.getRoom(room.room_id)
        } else {
            room = relevantRooms[0]
        }

        let nonce = Buffer.from(sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES))
        let combinedPayload = Buffer.concat([nonce, Buffer.from(sodium.crypto_secretbox_easy(Buffer.from("hello world", "utf8"), nonce, clientOut.sharedTx))])
        this.client.sendMessage(room.roomId, { msgtype: "m.text", body: Buffer.from(combinedPayload).toString("hex") })
    }
}