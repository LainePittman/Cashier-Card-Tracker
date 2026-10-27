import { useCallback, useState } from 'react'

// Which name this phone is set to. Saved in the browser's localStorage,
// so it survives refreshes and closing the tab, but stays on this phone.
const STORAGE_KEY = 'cct.currentEmployeeId'

function readSaved(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null // private browsing or storage blocked: just ask again
  }
}

export function useCurrentEmployee() {
  const [employeeId, setEmployeeIdState] = useState<string | null>(readSaved)

  const setEmployeeId = useCallback((id: string | null) => {
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore: the choice still works until the page is closed
    }
    setEmployeeIdState(id)
  }, [])

  return { employeeId, setEmployeeId }
}
