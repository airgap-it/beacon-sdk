export const checkInternetConnection = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    return false
  }

  try {
    const response = await fetch('https://www.google.com/', {
      method: 'HEAD',
      cache: 'no-store'
    })
    if (response.ok) {
      return true
    }
  } catch (error: any) {
    console.log('No internet connection.', error.message)
  }

  return false
}
