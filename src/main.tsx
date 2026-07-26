import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/** Make social preview image URLs absolute for crawlers/share sheets. */
function absolutizeShareMeta() {
  const origin = window.location.origin
  for (const selector of [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[name="image"]',
  ]) {
    const el = document.querySelector(selector)
    if (!el) continue
    const content = el.getAttribute('content')
    if (!content || content.startsWith('http://') || content.startsWith('https://')) continue
    el.setAttribute('content', new URL(content, origin).href)
  }

  let urlMeta = document.querySelector('meta[property="og:url"]')
  if (!urlMeta) {
    urlMeta = document.createElement('meta')
    urlMeta.setAttribute('property', 'og:url')
    document.head.appendChild(urlMeta)
  }
  urlMeta.setAttribute('content', origin + window.location.pathname)
}

absolutizeShareMeta()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
