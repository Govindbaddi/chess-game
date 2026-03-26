import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import store from './store.js'
import {Provider} from "react-redux"
import {BrowserRouter} from 'react-router-dom'
import { SnackbarProvider} from 'notistack'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
      <SnackbarProvider >
        <App />
      </SnackbarProvider>
       
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
