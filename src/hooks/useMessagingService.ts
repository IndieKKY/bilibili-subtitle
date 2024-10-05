import { setCurFetched, setCurInfo, setData, setInfos, setTitle, setUrl } from '@/redux/envReducer'
import { useMemo } from 'react'
import { useAppDispatch } from './redux'
import { MESSAGE_TO_APP_SET_INFOS, MESSAGE_TO_APP_SET_VIDEO_INFO } from '@/consts/const'
import useMessageService from '@/messaging/useMessageService'

const useMessagingService = () => {
  const dispatch = useAppDispatch()
  
  //methods
  const methods: {
    [key: string]: (params: any, context: MethodContext) => Promise<any>
  } = useMemo(() => ({
    [MESSAGE_TO_APP_SET_INFOS]: async (params: any, context: MethodContext) => {
      dispatch(setInfos(params.infos))
      dispatch(setCurInfo(undefined))
      dispatch(setCurFetched(false))
      dispatch(setData(undefined))
    },
    [MESSAGE_TO_APP_SET_VIDEO_INFO]: async (params: any, context: MethodContext) => {
      dispatch(setInfos(params.infos))
      dispatch(setUrl(params.url))
      dispatch(setTitle(params.title))
      console.debug('video title: ', params.title)
    },
  }), [dispatch])

  useMessageService(methods)
}

export default useMessagingService