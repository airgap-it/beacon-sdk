export abstract class Signer {
  public abstract async getAddresses(): Promise<string[]> // Should this be an array of permissionResponses?
  public abstract async sign(): Promise<string> // Should we allow to sign arrays?
}
