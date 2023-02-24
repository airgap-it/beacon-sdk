import { Component, createEffect, createSignal } from 'solid-js'
import { getTzip10Link } from 'src/utils/get-tzip10-link'
import { getQrData } from 'src/utils/qr'
import styles from './styles.css'

const COPY_RESET_TIMEOUT = 3000

interface QRProps {
  isWalletConnect: boolean
  isMobile: boolean
  walletName: string
  code: string
  onClickLearnMore?: () => void
}

const QR: Component<QRProps> = (props: QRProps) => {
  const [copied, setCopied] = createSignal<boolean>(false)

  const div = document.createElement('div')
  div.classList.add('qr-svg-wrapper')

  createEffect(() => {
    // TODO: We shouldn't do this here, that should be handled on a higher level
    const payload = props.code.startsWith('wc:')
      ? props.code
      : getTzip10Link('tezos://', props.code)

    const qrSVG = props.isMobile ? getQrData(payload, 300, 300) : getQrData(payload, 160, 160)
    div.innerHTML = qrSVG
  })

  async function handleCopyClipboard() {
    navigator.clipboard
      .writeText(props.code)
      .then(() => {
        if (!copied()) {
          setCopied(true)
          setTimeout(() => {
            setCopied(false)
          }, COPY_RESET_TIMEOUT)
        }
      })
      .catch((error) => {
        console.error('Error copying text: ', error)
      })
  }

  return (
    <div
      class="qr-wrapper"
      style={
        props.isMobile
          ? {
              'flex-direction': 'column',
              'align-items': 'center',
              'justify-content': 'center',
              height: '340px',
              'text-align': 'center',
              border: 'none'
            }
          : {}
      }
    >
      <div class="qr-left">
        {!props.isMobile && <h3>Or scan to connect</h3>}
        {!props.isMobile && (
          <span>{`Open ${props.walletName} Wallet on your mobile phone and scan.`}</span>
        )}
        {props.isMobile && (
          <span>
            {`Scan QR code with a ${
              props.isWalletConnect ? 'WalletConnect' : 'Beacon'
            }-compatible wallet.`}
            {props.onClickLearnMore && (
              <span
                class="qr-more-info"
                onClick={() => {
                  if (props.onClickLearnMore) props.onClickLearnMore()
                }}
              >
                Learn more
              </span>
            )}
          </span>
        )}

        {!props.isMobile && props.onClickLearnMore && (
          <span
            style={{ 'margin-top': 'auto' }}
            class="qr-more-info"
            onClick={() => {
              if (props.onClickLearnMore) props.onClickLearnMore()
            }}
          >
            Learn more
          </span>
        )}
      </div>
      <div
        class="qr-right"
        style={props.isMobile ? { 'background-color': 'transparent' } : {}}
        onClick={handleCopyClipboard}
      >
        {div}
        {copied() && (
          <div class="qr-copy-wrapper">
            <svg
              fill="currentColor"
              stroke-width="0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              height="1em"
              width="1em"
              style="overflow: visible;"
            >
              <path d="M243.8 339.8c-10.9 10.9-28.7 10.9-39.6 0l-64-64c-10.9-10.9-10.9-28.7 0-39.6 10.9-10.9 28.7-10.9 39.6 0l44.2 44.2 108.2-108.2c10.9-10.9 28.7-10.9 39.6 0 10.9 10.9 10.9 28.7 0 39.6l-128 128zM512 256c0 141.4-114.6 256-256 256S0 397.4 0 256 114.6 0 256 0s256 114.6 256 256zM256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48z"></path>
            </svg>
            <p>Copied!</p>
          </div>
        )}
        {!copied() && (
          <div class="qr-copy-wrapper">
            <svg
              fill="currentColor"
              stroke-width="0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              height="1em"
              width="1em"
              style="overflow: visible;"
            >
              <path d="M502.6 70.63 441.35 9.38C435.4 3.371 427.2 0 418.7 0H255.1c-35.35 0-64 28.66-64 64l.02 256c.88 35.4 29.58 64 64.88 64h192c35.2 0 64-28.8 64-64V93.25c0-8.48-3.4-16.62-9.4-22.62zM464 320c0 8.836-7.164 16-16 16H255.1c-8.838 0-16-7.164-16-16V64.13c0-8.836 7.164-16 16-16h128L384 96c0 17.67 14.33 32 32 32h47.1v192zM272 448c0 8.836-7.164 16-16 16H63.1c-8.838 0-16-7.164-16-16l.88-255.9c0-8.836 7.164-16 16-16H160V128H63.99c-35.35 0-64 28.65-64 64L0 448c.002 35.3 28.66 64 64 64h192c35.2 0 64-28.8 64-64v-32h-47.1l-.9 32z"></path>
            </svg>
            <p>Copy to clipboard</p>
          </div>
        )}
      </div>
    </div>
  )
}

export { styles }
export default QR
