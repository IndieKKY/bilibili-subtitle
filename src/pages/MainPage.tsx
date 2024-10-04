import React, {useCallback, useContext, useEffect, useMemo} from 'react'
import {useAppDispatch, useAppSelector} from '../hooks/redux'
import {setEnvData, setEnvReady, setFold, setTempData, setTempReady} from '../redux/envReducer'
import Header from '../biz/Header'
import Body from '../biz/Body'
import useSubtitleService from '../hooks/useSubtitleService'
import {cloneDeep} from 'lodash-es'
import {EVENT_EXPAND, MESSAGE_TO_INJECT_FOLD, PAGE_MAIN, PAGE_SETTINGS, STORAGE_ENV, STORAGE_TEMP} from '../const'
import {EventBusContext} from '../Router'
import useTranslateService from '../hooks/useTranslateService'
import {handleJson} from '@kky002/kky-util'
import {useLocalStorage} from '@kky002/kky-hooks'
import {Toaster} from 'react-hot-toast'
import {setTheme} from '../util/biz_util'
import useSearchService from '../hooks/useSearchService'
import useMessage from '../messaging/useMessage'
import useMessagingService from '../hooks/useMessagingService'

function App() {
  const dispatch = useAppDispatch()
  const fold = useAppSelector(state => state.env.fold)
  const eventBus = useContext(EventBusContext)
  const totalHeight = useAppSelector(state => state.env.totalHeight)
  const {sendInject} = useMessage()

  const foldCallback = useCallback(() => {
    dispatch(setFold(!fold))
    sendInject(MESSAGE_TO_INJECT_FOLD, {fold: !fold})
  }, [dispatch, fold])

  // handle event
  eventBus.useSubscription((event: any) => {
    if (event.type === EVENT_EXPAND) {
      if (fold) {
        foldCallback()
      }
    }
  })

  useSubtitleService()
  useTranslateService()
  useSearchService()

  return <div className='select-none w-full' style={{
    height: fold?undefined:`${totalHeight}px`,
  }}>
    <Header foldCallback={foldCallback}/>
    {!fold && <Body/>}
  </div>
}

export default App
