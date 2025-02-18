import { IndexedDBStorage, Logger, SDK_VERSION } from '@airgap/beacon-core'
import { StorageKey } from '@airgap/beacon-types'
import { For, createEffect, createSignal } from 'solid-js'
import styles from './styles.css'
import { currentBrowser, currentOS } from '../../utils/platform'

const logger = new Logger('BugReport')

interface StorageObject {
  [key: string]: string | null
}

interface BugReportRequest {
  userId: string
  title: string
  sdkVersion: string
  description: string
  steps: string
  os: string
  browser: string
  localStorage: string
  wcStorage: string
}

const BugReportForm = (props: any) => {
  const [title, setTitle] = createSignal('')
  const [titleTouched, setTitleTouched] = createSignal(false)
  const [description, setDescription] = createSignal('')
  const [descriptionTouched, setDescriptionTouched] = createSignal(false)
  const [isFormValid, setFormValid] = createSignal(false)
  const [isLoading, setIsLoading] = createSignal(false)
  const [didUserAllow, setDidUserAllow] = createSignal(false)
  const [status, setStatus] = createSignal<'success' | 'error' | null>(null)
  const [showThankYou, setShowThankYou] = createSignal(false)
  const db = new IndexedDBStorage('beacon', ['bug_report', 'metrics'])

  createEffect(() => {
    setDescription(prefillDescriptionField())
  })

  const prefillDescriptionField = () => {
    if (!localStorage) {
      return ''
    }

    const wcKey = Object.keys(localStorage).find((key) => key.includes('wc-init-error'))
    const beaconKey = Object.keys(localStorage).find((key) => key.includes('beacon-last-error'))

    if (!wcKey && !beaconKey) {
      return ''
    }

    let output = ''

    if (wcKey) {
      output += `WalletConnect error: ${localStorage.getItem(wcKey)} \n\n`
    }

    if (beaconKey) {
      output += `Beacon error: ${localStorage.getItem(beaconKey)} \n\n`
    }

    return output
  }

  const indexDBToMetadata = async () => {
    const wcResult: StorageObject = {}
    const beaconResult: StorageObject = {}
    let keys: string[] = []
    let values: string[] = []

    try {
      keys = (await db.getAllKeys()).map((key) => key.toString())
      values = await db.getAll()
    } catch (error: any) {
      logger.error('indexDBToMetadata', 'getAll failed: ', error.message)
      return [beaconResult, wcResult]
    }

    if (keys.length && values.length && keys.length === values.length) {
      keys.forEach(
        (key, i) => ((key.includes('beacon') ? beaconResult : wcResult)[key] = values[i])
      )
    }

    return [beaconResult, wcResult]
  }

  const getUserId = (): string => {
    if (!localStorage) {
      return 'UNKNOWN'
    }

    const key = Object.keys(localStorage).find((key) => key.includes('user-id'))

    return key && key.length ? localStorage.getItem(key) ?? 'UNKNOWN' : 'UNKNOWN'
  }

  createEffect(() => {
    setFormValid(didUserAllow())
  })

  /**
   * Recursively removes all properties whose key contains "seed"
   * from an object/array. Also, if a string is valid JSON,
   * it will attempt to clean its parsed value.
   */
  const clean = (value: any): any => {
    if (Array.isArray(value)) {
      // Process each element in the array.
      return value.map(clean)
    } else if (value !== null && typeof value === 'object') {
      // Process an object by filtering its keys.
      const result: Record<string, any> = {}
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          // Remove any property with "seed" in its name (case insensitive)
          if (key.toLowerCase().includes('seed')) continue
          result[key] = clean(value[key])
        }
      }
      return result
    } else if (typeof value === 'string') {
      // Try to parse the string as JSON.
      try {
        const parsed = JSON.parse(value)
        // If it parsed successfully, clean the parsed value
        // and re-stringify it so that we preserve the original type.
        return JSON.stringify(clean(parsed))
      } catch (err) {
        // If parsing fails, just return the original string.
        return value
      }
    }
    // For primitives (number, boolean, etc.), just return the value.
    return value
  }

  const sendRequest = (
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: any
  ) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }

    return fetch(url, method === 'GET' ? undefined : options)
  }

  const sendMetrics = async () => {
    const metrics = await db.getAll('metrics')

    if (!metrics || metrics.length === 0) {
      return
    }

    const payload = metrics.map((metric) => JSON.parse(metric))

    sendRequest(
      'https://beacon-backend.prod.gke.papers.tech/performance-metrics/saveAll',
      'POST',
      payload
    )
      .then(() => {
        db.clearStore('metrics')
      })
      .catch((error) => {
        console.error('Error while sending metrics:', error.message)
        setStatus('error')
      })
  }

  const handleSubmit = async (event: Event) => {
    event.preventDefault()
    setStatus(null)
    setShowThankYou(false)
    setIsLoading(true)

    const [beaconState, wcState] = await indexDBToMetadata()

    const request: BugReportRequest = {
      userId:
        beaconState[StorageKey.USER_ID] && beaconState[StorageKey.USER_ID].length
          ? beaconState[StorageKey.USER_ID]
          : getUserId(),
      title: title(),
      sdkVersion: SDK_VERSION,
      description: description(),
      steps: '<#EMPTY#>',
      os: currentOS(),
      browser: currentBrowser(),
      localStorage: JSON.stringify(clean(beaconState)),
      wcStorage: JSON.stringify(clean(wcState))
    }

    sendRequest('https://beacon-backend.prod.gke.papers.tech/bug-report/save', 'POST', request)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        setStatus('success')
        setTimeout(() => setShowThankYou(true), 600)
        sendMetrics()
      })
      .catch((error) => {
        console.error('Error while sending report:', error.message)
        setStatus('error')
      })
      .then(() => {
        setIsLoading(false)
        setTimeout(() => {
          props.onSubmit()
        }, 5000)
      })
  }

  return (
    <form onSubmit={handleSubmit} class="form-style">
      <div class="input-group">
        <label for="title" class="label-style">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title()}
          onBlur={(e) => {
            !titleTouched() && setTitleTouched(true)
            setTitle(e.currentTarget.value)
          }}
          class={`input-style`}
        />
      </div>
      <div class="input-group">
        <label for="description" class="label-style">
          Description
        </label>
        <textarea
          id="description"
          value={description()}
          onBlur={(e) => {
            !descriptionTouched() && setDescriptionTouched(true)
            setDescription(e.currentTarget.value)
          }}
          class={`textarea-style `}
        />
      </div>
      <div class="permissions-group">
        <label for="user-premissions">You agree to share anonymous data with the developers.</label>
        <input
          id="user-premissions"
          type="checkbox"
          onChange={() => setDidUserAllow((prev) => !prev)}
        />
      </div>
      <button
        type="submit"
        disabled={!isFormValid()}
        class={`button-style ${isFormValid() ? 'valid' : 'invalid'} ${
          isLoading() ? 'button-loading' : ''
        }`}
      >
        {!isLoading() && !status() ? 'Submit' : <>&nbsp;</>}
        {!isLoading() && status() && (
          <span class={status() === 'success' ? 'icon success-icon' : 'icon error-icon'}>
            {status() === 'success' ? '✓' : '✕'}
          </span>
        )}
        {showThankYou() && (
          <div class="thank-you-message">
            <For each={'Thank You!'.split('')}>
              {(letter, index) => (
                <span style={{ 'animation-delay': `${index() * 0.1}s` }}>{letter}</span>
              )}
            </For>
          </div>
        )}
      </button>
    </form>
  )
}

export { styles }
export default BugReportForm
