import './styles.css'
import { MessageTypes, type WalletState, type PendingRequest, type NetworkConfig } from '../beacon/types'
import { KNOWN_NETWORKS } from '../shared/networks'
import { renderSetupPage } from './pages/Setup'
import { renderMainPage } from './pages/Main'
import { renderApprovalModal, hideApprovalModal } from './components/ApprovalModal'

let walletState: WalletState | null = null
let pendingRequest: PendingRequest | null = null

async function init(): Promise<void> {
  walletState = await sendMessage<WalletState>(MessageTypes.GET_WALLET_STATE)

  // Get pending request if any
  pendingRequest = await sendMessage<PendingRequest | null>(MessageTypes.GET_PENDING_REQUEST)

  // Render appropriate view
  render()

  // Listen for updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === MessageTypes.PENDING_REQUEST) {
      pendingRequest = {
        id: message.payload.id,
        request: message.payload,
        rawRequest: null,
        tabId: 0,
        timestamp: Date.now()
      }
      renderApprovalModal(pendingRequest.request, handleApprove, handleReject)
    }
  })
}

function render(): void {
  const app = document.getElementById('app')
  if (!app) return

  if (!walletState?.isReady) {
    // Show setup page
    app.innerHTML = ''
    app.appendChild(renderSetupPage(handleWalletSetup))
  } else {
    // Show main wallet view
    app.innerHTML = ''
    app.appendChild(renderMainPage(walletState, handleNetworkChange, handleReset))

    // Show approval modal if there's a pending request
    if (pendingRequest) {
      renderApprovalModal(pendingRequest.request, handleApprove, handleReject)
    }
  }
}

async function handleWalletSetup(type: 'mnemonic' | 'privateKey' | 'generate', value?: string): Promise<void> {
  const app = document.getElementById('app')
  if (!app) return

  // Show loading
  const submitBtn = app.querySelector('button[type="submit"]') as HTMLButtonElement
  if (submitBtn) {
    submitBtn.disabled = true
    submitBtn.textContent = 'Setting up...'
  }

  try {
    const result = await sendMessage<{ success: boolean; error?: string }>(MessageTypes.INIT_WALLET, {
      type,
      value
    })

    if (result.success) {
      // Refresh state and re-render
      walletState = await sendMessage<WalletState>(MessageTypes.GET_WALLET_STATE)
      render()
    } else {
      // Show error
      const errorEl = app.querySelector('#setup-error')
      if (errorEl) {
        errorEl.textContent = result.error || 'Failed to setup wallet'
        errorEl.classList.remove('hidden')
      }

      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.textContent = type === 'generate' ? 'Generate New Wallet' : 'Import Wallet'
      }
    }
  } catch (error) {
    console.error('Setup error:', error)
    const errorEl = app.querySelector('#setup-error')
    if (errorEl) {
      errorEl.textContent = (error as Error).message
      errorEl.classList.remove('hidden')
    }
  }
}

async function handleApprove(approval: any): Promise<void> {
  if (!pendingRequest) return

  try {
    const result = await sendMessage<{ success: boolean; error?: string }>(MessageTypes.APPROVE_REQUEST, {
      requestId: pendingRequest.id,
      approval
    })

    if (result.success) {
      pendingRequest = null
      hideApprovalModal()
      // Refresh balance after operation
      walletState = await sendMessage<WalletState>(MessageTypes.GET_WALLET_STATE)
      render()
    } else {
      alert('Error: ' + (result.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Approve error:', error)
    alert('Error: ' + (error as Error).message)
  }
}

async function handleReject(): Promise<void> {
  if (!pendingRequest) return

  try {
    await sendMessage(MessageTypes.REJECT_REQUEST, {
      requestId: pendingRequest.id
    })

    pendingRequest = null
    hideApprovalModal()
  } catch (error) {
    console.error('Reject error:', error)
  }
}

async function handleNetworkChange(network: string): Promise<void> {
  // Send the new network to background and refresh state
  const networkConfig: NetworkConfig = KNOWN_NETWORKS[network] || { type: network }
  walletState = await sendMessage<WalletState>(MessageTypes.SET_NETWORK, networkConfig)
  render()
}

async function handleReset(): Promise<void> {
  if (!confirm('Are you sure you want to reset your wallet? Make sure you have backed up your mnemonic!')) {
    return
  }

  await chrome.storage.local.clear()
  walletState = null
  render()
}

function sendMessage<T>(type: string, payload?: any): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else if (response?.error) {
        reject(new Error(response.error))
      } else {
        resolve(response as T)
      }
    })
  })
}

init().catch(console.error)
