let navigateImpl: ((path: string) => void) | null = null

export function setNavigator(navigate: (path: string) => void) {
  navigateImpl = navigate
}

export function navigate(path: string) {
  if (navigateImpl) {
    navigateImpl(path)
    return
  }

  if (typeof window !== 'undefined') {
    window.location.href = path
  }
}

export function navigateToLogin() {
  navigate('/login')
}

export function navigateToError() {
  navigate('/error')
}
