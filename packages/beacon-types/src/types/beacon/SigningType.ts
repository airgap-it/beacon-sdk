export enum SigningType {
  RAW = 'raw', // Arbitrary payload (string), which will be hashed before signing
  OPERATION = 'operation', // "03" prefix
  MICHELINE = 'micheline' // "05" prefix
}
