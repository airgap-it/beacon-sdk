import { AlertConfig } from '../../common'
import PairingAlert from '../pairing-alert'

const AlertContent = (props: AlertConfig) => {
  return <PairingAlert {...props} />
}

export default AlertContent
