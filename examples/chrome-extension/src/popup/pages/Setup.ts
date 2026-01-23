type SetupHandler = (type: 'mnemonic' | 'privateKey' | 'generate', value?: string) => Promise<void>

export function renderSetupPage(onSetup: SetupHandler): HTMLElement {
  const container = document.createElement('div')
  container.className = 'flex flex-col'

  container.innerHTML = `
    <!-- Content -->
    <div class="p-4 space-y-4">
      <!-- Tab Buttons -->
      <div class="flex border-b border-gray-700">
        <button id="tab-generate" class="px-4 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-400">
          Generate
        </button>
        <button id="tab-mnemonic" class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white">
          Mnemonic
        </button>
        <button id="tab-privatekey" class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white">
          Private Key
        </button>
      </div>

      <!-- Generate Panel -->
      <div id="panel-generate" class="space-y-4">
        <p class="text-sm text-gray-400">
          Generate a new wallet with a fresh mnemonic phrase. Make sure to back it up!
        </p>
        <button
          type="submit"
          id="btn-generate"
          class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition"
        >
          Generate New Wallet
        </button>
      </div>

      <!-- Mnemonic Panel -->
      <div id="panel-mnemonic" class="space-y-4 hidden">
        <p class="text-sm text-gray-400">
          Import an existing wallet using a 24-word mnemonic phrase.
        </p>
        <textarea
          id="input-mnemonic"
          rows="3"
          class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Enter your 24-word mnemonic phrase..."
        ></textarea>
        <button
          type="submit"
          id="btn-mnemonic"
          class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition"
        >
          Import Wallet
        </button>
      </div>

      <!-- Private Key Panel -->
      <div id="panel-privatekey" class="space-y-4 hidden">
        <p class="text-sm text-gray-400">
          Import an existing wallet using a private key (starts with edsk).
        </p>
        <input
          type="password"
          id="input-privatekey"
          class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="edsk..."
        />
        <button
          type="submit"
          id="btn-privatekey"
          class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition"
        >
          Import Wallet
        </button>
      </div>

      <!-- Error Message -->
      <div id="setup-error" class="text-red-400 text-sm hidden"></div>
    </div>
  `

  // Tab switching logic
  const tabs = ['generate', 'mnemonic', 'privatekey']
  tabs.forEach((tab) => {
    const tabBtn = container.querySelector(`#tab-${tab}`) as HTMLButtonElement
    const panel = container.querySelector(`#panel-${tab}`) as HTMLElement

    tabBtn?.addEventListener('click', () => {
      // Hide all panels, remove active state from all tabs
      tabs.forEach((t) => {
        const p = container.querySelector(`#panel-${t}`) as HTMLElement
        const b = container.querySelector(`#tab-${t}`) as HTMLElement
        p?.classList.add('hidden')
        b?.classList.remove('border-blue-500', 'text-blue-400')
        b?.classList.add('border-transparent', 'text-gray-400')
      })

      // Show current panel, set active state
      panel?.classList.remove('hidden')
      tabBtn.classList.add('border-blue-500', 'text-blue-400')
      tabBtn.classList.remove('border-transparent', 'text-gray-400')

      // Clear error
      const errorEl = container.querySelector('#setup-error')
      errorEl?.classList.add('hidden')
    })
  })

  // Generate button
  container.querySelector('#btn-generate')?.addEventListener('click', () => {
    onSetup('generate')
  })

  // Mnemonic import
  container.querySelector('#btn-mnemonic')?.addEventListener('click', () => {
    const input = container.querySelector('#input-mnemonic') as HTMLTextAreaElement
    const value = input?.value.trim()

    if (!value) {
      const errorEl = container.querySelector('#setup-error')
      if (errorEl) {
        errorEl.textContent = 'Please enter a mnemonic phrase'
        errorEl.classList.remove('hidden')
      }
      return
    }

    onSetup('mnemonic', value)
  })

  // Private key import
  container.querySelector('#btn-privatekey')?.addEventListener('click', () => {
    const input = container.querySelector('#input-privatekey') as HTMLInputElement
    const value = input?.value.trim()

    if (!value) {
      const errorEl = container.querySelector('#setup-error')
      if (errorEl) {
        errorEl.textContent = 'Please enter a private key'
        errorEl.classList.remove('hidden')
      }
      return
    }

    if (!value.startsWith('edsk')) {
      const errorEl = container.querySelector('#setup-error')
      if (errorEl) {
        errorEl.textContent = 'Private key must start with "edsk"'
        errorEl.classList.remove('hidden')
      }
      return
    }

    onSetup('privateKey', value)
  })

  return container
}
