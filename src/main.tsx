import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.less'
import store from './store'
import {Provider} from 'react-redux'
import Router from './Router'
import {APP_DOM_ID} from './const'

const body = document.querySelector('body')
const app = document.createElement('div')
app.id = APP_DOM_ID
if (body != null) {
  body.prepend(app)
}

ReactDOM.createRoot(document.getElementById(APP_DOM_ID) as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <Router/>
    </Provider>
  </React.StrictMode>
)
