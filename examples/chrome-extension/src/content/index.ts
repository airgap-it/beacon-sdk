/**
 * Content Script - Beacon Protocol Bridge
 *
 * This script is injected into every page and handles:
 * 1. Ping/pong protocol for extension discovery
 * 2. Relaying encrypted messages between dApps and the background service worker
 *
 * The content script acts as a bridge between the page context (where the dApp runs)
 * and the extension context (background service worker).
 */

import { MessageTypes } from '../beacon/types'

/**
 * Listen for messages from the page (dApp).
 */
window.addEventListener('message', (event) => {
  // Security: Only accept messages from the same window
  if (event.source !== window) return

  const data = event.data

  // Ignore non-beacon messages
  if (!data || data.target !== 'toExtension') return

  // Handle ping/pong for extension discovery
  if (data.payload === 'ping') {
    handlePing()
    return
  }

  // Handle serialized beacon messages (pairing requests)
  if (typeof data.payload === 'string' && data.payload !== 'ping') {
    handleSerializedMessage(data)
    return
  }

  // Handle encrypted beacon messages
  if (data.encryptedPayload) {
    handleEncryptedMessage(data)
    return
  }
})

/**
 * Respond to ping with pong + extension metadata.
 * This is how dApps discover available wallet extensions.
 *
 * The SDK looks for messages with payload='pong' and a sender object containing:
 * - id: Extension ID
 * - name: Display name
 * - iconUrl: URL to extension icon
 */
function handlePing(): void {
  window.postMessage(
    {
      payload: 'pong',
      sender: {
        id: chrome.runtime.id,
        name: 'Beacon Example Wallet',
        iconUrl: chrome.runtime.getURL('icons/icon48.png')
      }
    },
    window.location.origin
  )
}

/**
 * Forward serialized beacon messages (pairing requests) to the background service worker.
 */
function handleSerializedMessage(data: { payload: string; targetId?: string }): void {
  // If targetId is specified and doesn't match our extension, ignore
  if (data.targetId && data.targetId !== chrome.runtime.id) {
    return
  }

  // Forward to background
  chrome.runtime.sendMessage({
    type: MessageTypes.BEACON_MESSAGE,
    payload: data
  }, () => {
    // Callback required to prevent "message channel closed" error
    if (chrome.runtime.lastError) {
      // Ignore - background may not be ready
    }
  })
}

/**
 * Forward encrypted beacon messages to the background service worker.
 */
function handleEncryptedMessage(data: { encryptedPayload: string; targetId?: string }): void {
  // If targetId is specified and doesn't match our extension, ignore
  if (data.targetId && data.targetId !== chrome.runtime.id) {
    return
  }

  // Forward to background
  chrome.runtime.sendMessage({
    type: MessageTypes.BEACON_MESSAGE,
    payload: data
  }, () => {
    // Callback required to prevent "message channel closed" error
    if (chrome.runtime.lastError) {
      // Ignore - background may not be ready
    }
  })
}

/**
 * Listen for responses from the background service worker.
 * Relay them back to the page for the dApp to receive.
 */
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === MessageTypes.BEACON_RESPONSE) {
    window.postMessage(message.payload, window.location.origin)
  }
})
