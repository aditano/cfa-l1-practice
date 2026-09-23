import { useEffect, useState } from 'react'

export type RouteName = 'home' | 'practice' | 'progress'

function readRoute(): RouteName {
  const hash = window.location.hash.replace(/^#\/?/, '')
  if (hash.startsWith('practice')) return 'practice'
  if (hash.startsWith('progress')) return 'progress'
  return 'home'
}

export function useRoute(): [RouteName, (route: RouteName) => void] {
  const [route, setRoute] = useState<RouteName>(readRoute)
  useEffect(() => {
    const onHash = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const go = (next: RouteName) => {
    window.location.hash = next === 'home' ? '#/' : `#/${next}`
    setRoute(next)
  }
  return [route, go]
}

function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('l1-theme', theme)
  }, [theme])
  return [theme, () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))]
}

export function Header({ route, go }: { route: RouteName; go: (route: RouteName) => void }) {
  const [theme, toggle] = useTheme()
  return (
    <header className="topbar">
      <div className="wrap topbar-inner">
        <button className="brand" type="button" onClick={() => go('home')}>
          <span className="brand-mark" aria-hidden="true" />
          L1 Practice
        </button>
        <nav className="nav" aria-label="Primary">
          <button type="button" className={route === 'practice' ? 'nav-link active' : 'nav-link'} onClick={() => go('practice')}>
            Practice
          </button>
          <button type="button" className={route === 'progress' ? 'nav-link active' : 'nav-link'} onClick={() => go('progress')}>
            Progress
          </button>
          <button type="button" className="nav-link" onClick={toggle}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </nav>
      </div>
    </header>
  )
}
