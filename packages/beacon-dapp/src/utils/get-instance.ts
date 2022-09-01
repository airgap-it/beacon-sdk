import { DAppClient, DAppClientOptions } from '..'

let _instance: DAppClient | undefined

/** Get a DAppClient instance. Will make sure only one dAppClient exists. After the first instance has been created, the config will be ignored, unless "reset" is set */
export const getDAppClientInstance = (config: DAppClientOptions, reset?: boolean): DAppClient => {
  if (_instance && reset) {
    _instance.disconnect()
    _instance = undefined
  }

  if (_instance) {
    return _instance
  }

  if (!_instance) {
    _instance = new DAppClient(config)
  }

  return _instance
}
