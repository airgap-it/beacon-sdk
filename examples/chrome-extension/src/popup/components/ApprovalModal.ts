import type { UIRequest, UIPermissionRequest, UISignRequest, UIOperationRequest } from '../../beacon/types'

type ApproveHandler = (approval: any) => Promise<void>
type RejectHandler = () => Promise<void>

let modalElement: HTMLElement | null = null

export function renderApprovalModal(request: UIRequest, onApprove: ApproveHandler, onReject: RejectHandler): void {
  // Remove existing modal if any
  hideApprovalModal()

  // Hide the main app content
  const appElement = document.getElementById('app')
  if (appElement) {
    appElement.style.display = 'none'
  }

  modalElement = document.createElement('div')
  modalElement.id = 'approval-modal'
  modalElement.className = 'w-[360px] bg-gray-900 flex flex-col'

  const content = getModalContent(request)

  modalElement.innerHTML = `
    <!-- Header -->
    <div class="bg-gray-800 px-4 py-3 border-b border-gray-700">
      <div class="flex items-center gap-2">
        ${request.appIcon ? `<img src="${request.appIcon}" class="w-6 h-6 rounded" alt="" />` : ''}
        <div>
          <h3 class="font-semibold">${getRequestTitle(request)}</h3>
          <p class="text-xs text-gray-400">${request.appName}</p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      ${content}
    </div>

    <!-- Footer -->
    <div class="bg-gray-800 px-4 py-3 border-t border-gray-700 flex gap-3">
      <button
        id="btn-reject"
        class="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md font-medium transition"
      >
        Reject
      </button>
      <button
        id="btn-approve"
        class="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-md font-medium transition"
      >
        Approve
      </button>
    </div>
  `

  // Event handlers
  modalElement.querySelector('#btn-approve')?.addEventListener('click', async () => {
    const btn = modalElement?.querySelector('#btn-approve') as HTMLButtonElement
    btn.disabled = true
    btn.textContent = 'Processing...'

    try {
      const approval = getApprovalData(request)
      await onApprove(approval)
    } catch (error) {
      btn.disabled = false
      btn.textContent = 'Approve'
    }
  })

  modalElement.querySelector('#btn-reject')?.addEventListener('click', () => {
    onReject()
  })

  document.body.appendChild(modalElement)
}

export function hideApprovalModal(): void {
  if (modalElement) {
    modalElement.remove()
    modalElement = null
  }

  // Restore the main app content
  const appElement = document.getElementById('app')
  if (appElement) {
    appElement.style.display = ''
  }
}

function getRequestTitle(request: UIRequest): string {
  switch (request.type) {
    case 'permission':
      return 'Connection Request'
    case 'sign':
      return 'Sign Payload'
    case 'operation':
      return 'Operation Request'
    default:
      return 'Request'
  }
}

function getModalContent(request: UIRequest): string {
  switch (request.type) {
    case 'permission':
      return getPermissionContent(request)
    case 'sign':
      return getSignContent(request)
    case 'operation':
      return getOperationContent(request)
    default:
      return '<p class="text-gray-400">Unknown request type</p>'
  }
}

function getPermissionContent(request: UIPermissionRequest): string {
  const scopes = request.scopes.map((s) => `<span class="px-2 py-1 bg-gray-700 rounded text-xs">${s}</span>`).join(' ')

  return `
    <div class="space-y-3">
      <div>
        <span class="text-xs text-gray-400">Requested Permissions</span>
        <div class="mt-1 flex flex-wrap gap-2">${scopes}</div>
      </div>
      ${
        request.network
          ? `
        <div>
          <span class="text-xs text-gray-400">Network</span>
          <div class="mt-1 px-3 py-2 bg-gray-700 rounded text-sm">
            ${request.network.type}
            ${request.network.rpcUrl ? `<span class="text-gray-400 text-xs ml-2">${request.network.rpcUrl}</span>` : ''}
          </div>
        </div>
      `
          : ''
      }
      <div class="bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
        <p class="text-xs text-yellow-300">
          This will allow ${request.appName} to request operations from your wallet.
        </p>
      </div>
    </div>
  `
}

function getSignContent(request: UISignRequest): string {
  const truncatedPayload = request.payload.length > 200 ? request.payload.slice(0, 200) + '...' : request.payload

  return `
    <div class="space-y-3">
      <div>
        <span class="text-xs text-gray-400">Signing Type</span>
        <div class="mt-1 px-3 py-2 bg-gray-700 rounded text-sm">${request.signingType}</div>
      </div>
      <div>
        <span class="text-xs text-gray-400">Payload</span>
        <div class="mt-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded font-mono text-xs break-all max-h-32 overflow-y-auto">
          ${truncatedPayload}
        </div>
      </div>
      <div class="bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
        <p class="text-xs text-yellow-300">
          Verify the payload before signing. Malicious payloads could be dangerous.
        </p>
      </div>
    </div>
  `
}

function getOperationContent(request: UIOperationRequest): string {
  const opsHtml = request.operations
    .map((op, i) => {
      let details = `<div class="font-medium capitalize">${op.kind}</div>`

      if (op.destination) {
        const truncDest = `${op.destination.slice(0, 8)}...${op.destination.slice(-6)}`
        details += `<div class="text-xs text-gray-400">To: ${truncDest}</div>`
      }

      if (op.amount) {
        const tez = parseInt(op.amount) / 1_000_000
        details += `<div class="text-xs text-gray-400">Amount: ${tez} XTZ</div>`
      }

      if (op.delegate) {
        const truncDelegate = `${op.delegate.slice(0, 8)}...${op.delegate.slice(-6)}`
        details += `<div class="text-xs text-gray-400">Delegate: ${truncDelegate}</div>`
      }

      return `<div class="px-3 py-2 bg-gray-700 rounded">${details}</div>`
    })
    .join('')

  return `
    <div class="space-y-3">
      <div>
        <span class="text-xs text-gray-400">Network</span>
        <div class="mt-1 px-3 py-2 bg-gray-700 rounded text-sm">
          ${request.network.type}
        </div>
      </div>
      <div>
        <span class="text-xs text-gray-400">Operations (${request.operations.length})</span>
        <div class="mt-1 space-y-2">${opsHtml}</div>
      </div>
      <div class="bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
        <p class="text-xs text-yellow-300">
          This will broadcast operations to the Tezos network. Verify all details carefully.
        </p>
      </div>
    </div>
  `
}

function getApprovalData(request: UIRequest): any {
  switch (request.type) {
    case 'permission':
      return {
        scopes: request.scopes,
        network: request.network
      }
    case 'sign':
      return {}
    case 'operation':
      return {}
    default:
      return {}
  }
}
