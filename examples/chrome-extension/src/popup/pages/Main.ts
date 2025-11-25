import type { WalletState } from '../../beacon/types'
import { KNOWN_NETWORKS, getExplorerUrl } from '../../shared/networks'

type NetworkChangeHandler = (network: string) => Promise<void>
type ResetHandler = () => Promise<void>

export function renderMainPage(
  state: WalletState,
  onNetworkChange: NetworkChangeHandler,
  onReset: ResetHandler
): HTMLElement {
  const container = document.createElement('div')
  container.className = 'flex flex-col'

  const networkName = state.network?.type
    ? KNOWN_NETWORKS[state.network.type]?.name || state.network.type
    : 'Unknown'

  const explorerUrl = state.address ? getExplorerUrl(state.address, state.network?.type) : '#'

  container.innerHTML = `
    <!-- Wallet Info -->
    <div class="p-4 space-y-4">
      <!-- Address Card -->
      <div class="bg-gray-800 rounded-lg p-4 space-y-2">
        <span class="text-xs text-gray-400">Address</span>
        <div class="flex items-start gap-1.5">
          <button
            id="btn-copy"
            class="p-0.5 hover:bg-gray-700 rounded transition flex-shrink-0"
            title="Copy address"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </button>
          <code class="text-xs font-mono break-all">${state.address || '---'}</code>
        </div>
      </div>

      <!-- Balance -->
      <div class="bg-gray-800 rounded-lg p-4">
        <span class="text-xs text-gray-400">Balance</span>
        <div class="flex items-center justify-between mt-1">
          <div class="text-2xl font-semibold">${state.balance || 'Loading...'}</div>
          <div class="flex flex-col items-end gap-1">
            <button
              id="btn-network"
              class="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
              title="Change network"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
              </svg>
              <span>${networkName}</span>
            </button>
            <a
              href="${explorerUrl}"
              target="_blank"
              class="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
              title="View on explorer"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              <span>Explorer</span>
            </a>
          </div>
        </div>
      </div>

    </div>

    <!-- Network Modal -->
    <div id="network-modal" class="hidden fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <div class="bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm">
        <div class="px-4 py-3 border-b border-gray-700">
          <h3 class="font-semibold">Select Network</h3>
        </div>
        <div class="p-2 max-h-64 overflow-y-auto">
          ${Object.entries(KNOWN_NETWORKS)
            .filter(([key]) => key !== 'custom')
            .map(
              ([key, net]) => `
              <button
                class="network-option w-full px-3 py-2 text-left hover:bg-gray-700 rounded text-sm flex items-center justify-between ${state.network?.type === key ? 'bg-gray-700' : ''}"
                data-network="${key}"
              >
                <span>${net.name}</span>
                ${state.network?.type === key ? '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : ''}
              </button>
            `
            )
            .join('')}
        </div>
        <div class="px-4 py-3 border-t border-gray-700">
          <button
            id="btn-close-network"
            class="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-800">
      <button
        id="btn-reset"
        class="w-full py-2 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-md text-sm transition"
      >
        Reset Wallet
      </button>
    </div>
  `

  // Copy address
  container.querySelector('#btn-copy')?.addEventListener('click', async () => {
    if (state.address) {
      await navigator.clipboard.writeText(state.address)
      const btn = container.querySelector('#btn-copy') as HTMLButtonElement
      btn.innerHTML = `
        <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      `
      setTimeout(() => {
        btn.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        `
      }, 1500)
    }
  })

  // Network modal
  const networkModal = container.querySelector('#network-modal') as HTMLElement

  container.querySelector('#btn-network')?.addEventListener('click', () => {
    networkModal.classList.remove('hidden')
  })

  container.querySelector('#btn-close-network')?.addEventListener('click', () => {
    networkModal.classList.add('hidden')
  })

  // Close modal when clicking backdrop
  networkModal?.addEventListener('click', (e) => {
    if (e.target === networkModal) {
      networkModal.classList.add('hidden')
    }
  })

  // Network selection
  container.querySelectorAll('.network-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const network = (btn as HTMLElement).dataset.network
      if (network) {
        networkModal.classList.add('hidden')
        onNetworkChange(network)
      }
    })
  })

  // Reset
  container.querySelector('#btn-reset')?.addEventListener('click', () => {
    onReset()
  })

  return container
}
