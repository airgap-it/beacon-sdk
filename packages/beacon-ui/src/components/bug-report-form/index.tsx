import React, { useState, useEffect } from 'react'
import { BACKEND_URL, IndexedDBStorage, Logger, SDK_VERSION } from '@airgap/beacon-core'
import { StorageKey } from '@airgap/beacon-types'
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

const BugReportForm: React.FC<{ onSubmit: () => void }> = (props) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isFormValid, setFormValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [didUserAllow, setDidUserAllow] = useState(false)
  const [status, setStatus] = useState<'success' | 'error' | null>(null)
  const [showThankYou, setShowThankYou] = useState(false)
  const db = new IndexedDBStorage('beacon', ['bug_report', 'metrics'])

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

  useEffect(() => {
    setFormValid(didUserAllow)
  }, [didUserAllow])

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

    sendRequest(`${BACKEND_URL}/performance-metrics/saveAll`, 'POST', payload)
      .then(() => {
        db.clearStore('metrics')
      })
      .catch((error) => {
        console.error('Error while sending metrics:', error.message)
        setStatus('error')
      })
  }

  const getStorageKeys = () => {
    if (!localStorage) {
      return []
    }

    const wcKey = Object.keys(localStorage).find((key) => key.includes('wc-init-error'))
    const beaconKey = Object.keys(localStorage).find((key) => key.includes('beacon-last-error'))

    return [wcKey, beaconKey] as const
  }

  const handleSubmit = async (event: React.FormEvent) => {
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
      title,
      sdkVersion: SDK_VERSION,
      description,
      steps: '<#EMPTY#>',
      os: currentOS(),
      browser: currentBrowser(),
      localStorage: JSON.stringify(beaconState),
      wcStorage: JSON.stringify(wcState)
    }

    sendRequest(`${BACKEND_URL}/bug-report/save`, 'POST', request)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        setStatus('success')
        setTimeout(() => setShowThankYou(true), 600)
        sendMetrics()
        const [wcKey, beaconKey] = getStorageKeys()
        wcKey && localStorage.removeItem(wcKey)
        beaconKey && localStorage.removeItem(beaconKey)
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
    <form onSubmit={handleSubmit} className="form-style">
      <div className="input-group">
        <label htmlFor="title" className="label-style">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          className={`input-style`}
        />
      </div>
      <div className="input-group">
        <label htmlFor="description" className="label-style">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          className={`textarea-style`}
        />
      </div>
      <div className="permissions-group">
        <label htmlFor="user-permissions">
          You agree to share anonymous data with the developers.
        </label>
        <input
          id="user-permissions"
          type="checkbox"
          onChange={() => setDidUserAllow((prev) => !prev)}
        />
      </div>
      <button
        type="submit"
        disabled={!isFormValid}
        className={`button-style ${isFormValid ? 'valid' : 'invalid'} ${
          isLoading ? 'button-loading' : ''
        }`}
      >
        {!isLoading && !status ? 'Submit' : <>&nbsp;</>}
        {!isLoading && status && (
          <span className={status === 'success' ? 'icon success-icon' : 'icon error-icon'}>
            {status === 'success' ? '✓' : '✕'}
          </span>
        )}
        {showThankYou && (
          <div className="thank-you-message">
            {'Thank You!'.split('').map((letter, index) => (
              <span key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                {letter}
              </span>
            ))}
          </div>
        )}
      </button>
    </form>
  )
}

export default BugReportForm
