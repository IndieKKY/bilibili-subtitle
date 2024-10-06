import { setCurFetched, setCurInfo, setData, setInfos, setTitle, setUrl } from '@/redux/envReducer'
import { useMemo } from 'react'
import { useAppDispatch } from './redux'
import useMessagingService from '@/messaging/layer2/useMessagingService'

const useMessageService = () => {
  const dispatch = useAppDispatch()
  
  //methods
  const methods: {
    [K in AllAPPMessages['method']]: (params: Extract<AllAPPMessages, { method: K }>['params'], context: MethodContext) => Promise<any>
  } = useMemo(() => ({
    SET_INFOS: async (params, context: MethodContext) => {
      dispatch(setInfos(params.infos))
      dispatch(setCurInfo(undefined))
      dispatch(setCurFetched(false))
      dispatch(setData(undefined))
    },
    SET_VIDEO_INFO: async (params, context: MethodContext) => {
      dispatch(setInfos(params.infos))
      dispatch(setUrl(params.url))
      dispatch(setTitle(params.title))
      console.debug('video title: ', params.title)
    },
  }), [dispatch])

  useMessagingService(methods)
}

export default useMessageService