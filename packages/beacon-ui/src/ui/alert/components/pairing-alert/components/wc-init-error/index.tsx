import { StorageKey } from '@airgap/beacon-types'
import Info from '../../../../../../components/info'

const WCInitError: React.FC<any> = (props) => {
  const errorMessage = localStorage ? localStorage.getItem(StorageKey.WC_INIT_ERROR) : undefined
  const description: any = (
    <>
      <h3 style={{ color: '#FF4136', margin: '0.6px' }}>A network error occurred.</h3>
      <h4>
        This issue does not concern your wallet or dApp. If the problem persists, please report it
        to the Beacon team{' '}
        <span
          style={{ textDecoration: 'underline', color: '#007bff', cursor: 'pointer' }}
          onClick={() => props.handleUpdateState('bug-report')}
        >
          here
        </span>
      </h4>
      {errorMessage && <span>{errorMessage}</span>}
    </>
  )
  return <Info title={props.title} description={description} border />
}

export default WCInitError
