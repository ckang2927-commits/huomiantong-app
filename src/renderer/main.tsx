import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { FloatingWindow } from './components/FloatingWindow'
import './styles.css'

const params = new URLSearchParams(window.location.search)
const view = params.get('view')

document.body.classList.toggle('floating-page', view === 'floating')

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>{view === 'floating' ? <FloatingWindow /> : <App />}</React.StrictMode>
)
