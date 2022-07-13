import { DAppClient, DAppClientOptions } from '..'

let _instance: DAppClient | undefined
let _config: DAppClientOptions | undefined

/** Get a DAppClient instance. Will make sure only one dAppClient exists. After the first instance has been created, the config will be ingored, unless "reset" is set */
export const getDAppClientInstance = (config: DAppClientOptions, reset: boolean): DAppClient => {
  if (_instance && reset) {
    _instance.disconnect()
    _instance = undefined
    _config = undefined
  }

  if (_instance) {
    return _instance
  }

  if (!_instance) {
    _instance = new DAppClient(config)
    _config = config
  }

  return _instance
}
