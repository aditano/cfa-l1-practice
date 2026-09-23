import { Footer } from './components/Footer'
import { Header, useRoute } from './components/Header'
import { Home } from './components/Home'
import { Practice } from './components/Practice'
import { ProgressPage } from './components/ProgressPage'

export function App() {
  const [route, go] = useRoute()
  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header route={route} go={go} />
      <main id="main">
        {route === 'home' ? <Home go={go} /> : null}
        {route === 'practice' ? <Practice /> : null}
        {route === 'progress' ? <ProgressPage /> : null}
      </main>
      <Footer />
    </div>
  )
}
