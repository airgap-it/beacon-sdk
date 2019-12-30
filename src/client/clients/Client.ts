export enum BeaconEvent {
  BEACON_HANDSHAKE = 'beacon_handshake', // 
  CONNECTED = 'connected' // Triggered when connection is established
}

export class Client {
  constructor(name: string) {
    console.log(name)
  }
}
