import React, {useCallback, useContext, useEffect} from 'react'
import {useAppDispatch, useAppSelector} from '../hooks/redux'
import Header from '../components/Header'
import Body from '../components/Body'
import useSubtitleService from '../hooks/useSubtitleService'
import {EVENT_EXPAND, MESSAGE_TO_INJECT_FOLD} from '../consts/const'
import {EventBusContext} from '../Router'
import useTranslateService from '../hooks/useTranslateService'
import {setTheme} from '../utils/bizUtil'
import useSearchService from '../hooks/useSearchService'
import useMessage from '../messaging/layer2/useMessaging'
import {setFold} from '../redux/envReducer'

function App() {
  const dispatch = useAppDispatch()
  const fold = useAppSelector(state => state.env.fold)
  const eventBus = useContext(EventBusContext)
  const totalHeight = useAppSelector(state => state.env.totalHeight)
  const {sendInject} = useMessage()
  const envData = useAppSelector(state => state.env.envData)
  
  const foldCallback = useCallback(() => {
    dispatch(setFold(!fold))
    sendInject(MESSAGE_TO_INJECT_FOLD, {fold: !fold})
  }, [dispatch, fold, sendInject])

  // handle event
  eventBus.useSubscription((event: any) => {
    if (event.type === EVENT_EXPAND) {
      if (fold) {
        foldCallback()
      }
    }
  })

  // theme改变时，设置主题
  useEffect(() => {
    setTheme(envData.theme)
  }, [envData.theme])

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
