import React, { useState, useEffect } from 'react'
import { IndexedDBStorage, Logger, SDK_VERSION } from '@airgap/beacon-core'
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
  const [titleTouched, setTitleTouched] = useState(false)
  const [titleErrorMsg, setTitleErrorMsg] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionTouched, setDescriptionTouched] = useState(false)
  const [descriptionErrorMsg, setDescriptionErrorMsg] = useState('')
  const [steps, setSteps] = useState('')
  const [stepsTouched, setStepsTouched] = useState(false)
  const [stepsErrorMsg, setStepsErrorMsg] = useState('')
  const [isFormValid, setFormValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [didUserAllow, setDidUserAllow] = useState(false)
  const [status, setStatus] = useState<'success' | 'error' | null>(null)
  const [showThankYou, setShowThankYou] = useState(false)
  const db = new IndexedDBStorage('beacon', 'bug_report')

  const isTitleValid = () => {
    const check = title.trim().length > 10
    const invalidText = check ? '' : 'The title must be at least 10 characters long.'
    setTitleErrorMsg(invalidText)
    return check
  }

  const isDescriptionValid = () => {
    const check = description.trim().length >= 30
    const invalidText = check ? '' : 'The description must be at least 30 characters long.'
    setDescriptionErrorMsg(invalidText)
    return check
  }

  const areStepsValid = () => {
    const check = steps.trim().length >= 30
    const invalidText = check
      ? ''
      : 'Write at least 30 characters to describe the steps to reproduce.'
    setStepsErrorMsg(invalidText)
    return check
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

  useEffect(() => {
    const titleValid = isTitleValid(),
      descriptionValid = isDescriptionValid(),
      stepsValid = areStepsValid(),
      userAllow = didUserAllow
    setFormValid(titleValid && descriptionValid && stepsValid && userAllow)
  }, [title, description, steps, didUserAllow])

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
      steps,
      os: currentOS(),
      browser: currentBrowser(),
      localStorage: JSON.stringify(beaconState),
      wcStorage: JSON.stringify(wcState)
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    }

    fetch('https://beacon-backend.prod.gke.papers.tech/bug-report/save', options)
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
          onBlur={() => setTitleTouched(true)}
          className={`input-style ${titleTouched && titleErrorMsg.length ? 'invalid' : ''}`}
        />
        {titleTouched && titleErrorMsg.length > 0 && (
          <label className="error-label">{titleErrorMsg}</label>
        )}
      </div>
      <div className="input-group">
        <label htmlFor="description" className="label-style">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          onBlur={() => setDescriptionTouched(true)}
          className={`textarea-style ${
            descriptionTouched && descriptionErrorMsg.length ? 'invalid' : ''
          }`}
        />
        {descriptionTouched && descriptionErrorMsg.length > 0 && (
          <label className="error-label">{descriptionErrorMsg}</label>
        )}
      </div>
      <div className="input-group">
        <label htmlFor="steps" className="label-style">
          Steps to Reproduce
        </label>
        <textarea
          id="steps"
          value={steps}
          onChange={(e) => setSteps(e.currentTarget.value)}
          onBlur={() => setStepsTouched(true)}
          className={`textarea-style ${stepsTouched && stepsErrorMsg.length ? 'invalid' : ''}`}
        />
        {stepsTouched && stepsErrorMsg.length > 0 && (
          <label className="error-label">{stepsErrorMsg}</label>
        )}
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
