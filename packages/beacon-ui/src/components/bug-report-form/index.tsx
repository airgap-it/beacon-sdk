import React, { useState, useEffect } from 'react'
import { IndexedDBStorage, Logger, SDK_VERSION } from '@airgap/beacon-core'
import { StorageKey } from '@airgap/beacon-types'
import { currentBrowser, currentOS } from '../../utils/platform'
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import StatusIcon from './components/status-icon';


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
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2, // spacing between fields
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      {/* Title Field */}
      <TextField
        id="title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => setTitleTouched(true)}
        error={titleTouched && Boolean(titleErrorMsg)}
        helperText={titleTouched && titleErrorMsg ? titleErrorMsg : ''}
        fullWidth
      />

      {/* Description Field */}
      <TextField
        id="description"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => setDescriptionTouched(true)}
        error={descriptionTouched && Boolean(descriptionErrorMsg)}
        helperText={descriptionTouched && descriptionErrorMsg ? descriptionErrorMsg : ''}
        multiline
        rows={4}
        fullWidth
      />

      {/* Steps Field */}
      <TextField
        id="steps"
        label="Steps to Reproduce"
        value={steps}
        onChange={(e) => setSteps(e.target.value)}
        onBlur={() => setStepsTouched(true)}
        error={stepsTouched && Boolean(stepsErrorMsg)}
        helperText={stepsTouched && stepsErrorMsg ? stepsErrorMsg : ''}
        multiline
        rows={4}
        fullWidth
      />

      {/* Permissions Checkbox */}
      <FormControlLabel
        control={
          <Checkbox
            id="user-permissions"
            checked={didUserAllow}
            onChange={() => setDidUserAllow((prev) => !prev)}
          />
        }
        label="You agree to share anonymous data with the developers."
      />

      {/* Submit Button */}
      <Button
        type="submit"
        variant="contained"
        disabled={!isFormValid}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          position: 'relative',
        }}
      >
        {/* If not loading and no status, show "Submit" */}
        {!isLoading && !status ? 'Submit' : <>&nbsp;</>}

        {/* If there's a status and not loading, show a success/error icon */}
        <StatusIcon isLoading={isLoading} status={status} />

        {/* Thank You! message absolutely positioned below the Button */}
        {showThankYou && (
          <Box>
            {'Thank You!'.split('').map((letter, index) => (
              <Typography
                key={index}
                component="span"
                sx={{
                  display: 'inline-block',
                  // Prevent uppercase transformation from parent styles:
                  textTransform: 'none',
                  // Ensure the space is preserved if styling is trimming it:
                  whiteSpace: 'pre',
                  opacity: 0,
                  animation: `fadeInUp 0.3s ease forwards ${index * 0.1}s`,
                  '@keyframes fadeInUp': {
                    to: {
                      opacity: 1,
                      transform: 'translateY(-3px)',
                    },
                  },
                }}
              >
                {letter}
              </Typography>
            ))}
          </Box>
        )}
      </Button>
    </Box>
  );
}

export default BugReportForm
