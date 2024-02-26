import { IndexedDBStorage } from '@airgap/beacon-core'
import { StorageKey } from '@airgap/beacon-types'
import { For, createEffect, createSignal } from 'solid-js'
import styles from './styles.css'

interface StorageObject {
  [key: string]: string | null
}

interface BugReportRequest {
  title: string
  description: string
  steps: string
  os: string
  browser: string
  localStorage: string
  wcStorage: string
}

const BugReportForm = (props: any) => {
  const [title, setTitle] = createSignal('')
  const [description, setDescription] = createSignal('')
  const [steps, setSteps] = createSignal('')
  const [isFormValid, setFormValid] = createSignal(false)
  const [isLoading, setIsLoading] = createSignal(false)
  const [didUserAllow, setDidUserAllow] = createSignal(false)
  const [status, setStatus] = createSignal<'success' | 'error' | null>(null)
  const [showThankYou, setShowThankYou] = createSignal(false)

  const isTitleValid = () => {
    return title().replace(/ /gi, '').length > 10
  }

  const isDescriptionValid = () => {
    return description().replace(/ /gi, '').length >= 30
  }

  const areStepsValid = () => {
    return steps().replace(/ /gi, '').length >= 30
  }

  const localStorageToMetadata = () => {
    const result: StorageObject = {}

    Object.keys(localStorage)
      .filter((key) => key.includes('beacon'))
      .forEach((key) => (result[key] = localStorage.getItem(key)))

    return result
  }

  const indexDBToMetadata = async () => {
    const result: StorageObject = {}
    const db = new IndexedDBStorage()

    try {
      const keys = (await db.getAllKeys()).map((key) => key.toString())
      for (const key of keys) {
        result[key] = (await db.get(key as StorageKey)) as string
      }
    } catch (error: any) {
      console.error(error.message)
    }

    return result
  }

  const currentOS = () => {
    var ua = navigator.userAgent
    var osMap = new Map([
      ['Windows', 'Windows'],
      ['Mac', 'Mac OS'],
      ['Linux', 'Linux'],
      ['iPhone', 'iOS'],
      ['iPad', 'iOS'],
      ['Android', 'Android']
    ])

    for (let [key, value] of osMap) {
      if (ua.indexOf(key) !== -1) {
        return value
      }
    }
    return 'UNKOWN'
  }

  const currentBrowser = () => {
    var ua = navigator.userAgent
    var browserMap = new Map([
      ['Firefox', 'Firefox'],
      ['Opera', 'Opera'],
      ['OPR', 'Opera'],
      ['Trident', 'Internet Explorer'],
      ['Edge', 'Edge'],
      ['Chrome', 'Chrome'],
      ['Safari', 'Safari']
    ])

    for (let [key, value] of browserMap) {
      if (ua.indexOf(key) !== -1) {
        return value
      }
    }
    return 'UNKOWN'
  }

  createEffect(() => {
    setFormValid(isTitleValid() && isDescriptionValid() && areStepsValid() && didUserAllow())
  })

  const handleSubmit = async (event: Event) => {
    event.preventDefault()
    setStatus(null)
    setShowThankYou(false)
    setIsLoading(true)

    const request: BugReportRequest = {
      title: title(),
      description: description(),
      steps: steps(),
      os: currentOS(),
      browser: currentBrowser(),
      localStorage: JSON.stringify(localStorageToMetadata()),
      wcStorage: JSON.stringify(await indexDBToMetadata())
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    }

    fetch('https://beacon-backend.dev.gke.papers.tech/save', options)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        setStatus('success')
        setTimeout(() => setShowThankYou(true), 600)
        return response.json()
      })
      .then((data) => {
        console.log(data)
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
          onBlur={(e) => setTitle(e.currentTarget.value)}
          class="input-style"
        />
      </div>
      <div class="input-group">
        <label for="description" class="label-style">
          Description
        </label>
        <textarea
          id="description"
          value={description()}
          onBlur={(e) => setDescription(e.currentTarget.value)}
          class="textarea-style"
        />
      </div>
      <div class="input-group">
        <label for="steps" class="label-style">
          Steps to Reproduce
        </label>
        <textarea
          id="steps"
          value={steps()}
          onBlur={(e) => setSteps(e.currentTarget.value)}
          class="textarea-style"
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
