import {MouseEvent, useCallback, useContext, useRef, useState} from 'react'
import {useClickAway} from 'ahooks'
import {
  FiMoreVertical,
  ImDownload3,
  IoMdSettings,
  RiFileCopy2Line
} from 'react-icons/all'
import Popover from '../components/Popover'
import {Placement} from '@popperjs/core/lib/enums'
import {useAppDispatch, useAppSelector} from '../hooks/redux'
import {setEnvData, setTempData} from '../redux/envReducer'
import {EventBusContext} from '../Router'
import {EVENT_EXPAND} from '../consts/const'
import {formatSrtTime, formatTime, formatVttTime, downloadText} from '../utils/util'
import {openUrl} from '../utils/env_util'
import toast from 'react-hot-toast'
import {getSummarize} from '../utils/bizUtil'
import dayjs from 'dayjs'
import { useMessage } from '@/hooks/useMessageService'

interface Props {
  placement: Placement
}

const DownloadTypes = [
  {
    type: 'text',
    name: '列表',
  },
  {
    type: 'textWithTime',
    name: '列表(带时间)',
  },
  {
    type: 'article',
    name: '文章',
  },
  {
    type: 'srt',
    name: 'srt',
  },
  {
    type: 'vtt',
    name: 'vtt',
  },
  {
    type: 'json',
    name: '原始json',
  },
  {
    type: 'summarize',
    name: '总结',
  },
]

const MoreBtn = (props: Props) => {
  const {placement} = props
  const dispatch = useAppDispatch()

  const moreRef = useRef(null)
  const data = useAppSelector(state => state.env.data)
  const envReady = useAppSelector(state => state.env.envReady)
  const envData = useAppSelector(state => state.env.envData)
  const downloadType = useAppSelector(state => state.env.tempData.downloadType)
  const [moreVisible, setMoreVisible] = useState(false)
  const eventBus = useContext(EventBusContext)
  const segments = useAppSelector(state => state.env.segments)
  const url = useAppSelector(state => state.env.url)
  const title = useAppSelector(state => state.env.title)
  const ctime = useAppSelector(state => state.env.ctime) // 时间戳，单位s
  const author = useAppSelector(state => state.env.author)
  const curSummaryType = useAppSelector(state => state.env.tempData.curSummaryType)

  const {sendInject} = useMessage(!!envData.sidePanel)

  const downloadCallback = useCallback((download: boolean) => {
    if (data == null) {
      return
    }

    let fileName = title
    let s, suffix
    const time = ctime ? dayjs(ctime * 1000).format('YYYY-MM-DD HH:mm:ss') : '' // 2024-05-01 12:00:00
    if (!downloadType || downloadType === 'text') {
      s = `${title??'无标题'}\n${url??'无链接'}\n${author??'无作者'} ${time}\n\n`
      for (const item of data.body) {
        s += item.content + '\n'
      }
      suffix = 'txt'
    } else if (downloadType === 'textWithTime') {
      s = `${title??'无标题'}\n${url??'无链接'}\n${author??'无作者'} ${time}\n\n`
      for (const item of data.body) {
        s += formatTime(item.from) + ' ' + item.content + '\n'
      }
      suffix = 'txt'
    } else if (downloadType === 'article') {
      s = `${title??'无标题'}\n${url??'无链接'}\n${author??'无作者'} ${time}\n\n`
      for (const item of data.body) {
        s += item.content + ', '
      }
      s = s.substring(0, s.length - 1) // remove last ','
      suffix = 'txt'
    } else if (downloadType === 'srt') {
      /**
       * 1
       * 00:05:00,400 --> 00:05:15,300
       * This is an example of
       * a subtitle.
       *
       * 2
       * 00:05:16,400 --> 00:05:25,300
       * This is an example of
       * a subtitle - 2nd subtitle.
       */
      s = ''
      for (const item of data.body) {
        const ss = (item.idx + 1) + '\n' + formatSrtTime(item.from) + ' --> ' + formatSrtTime(item.to) + '\n' + ((item.content?.trim()) ?? '') + '\n\n'
        s += ss
      }
      s = s.substring(0, s.length - 1)// remove last '\n'
      suffix = 'srt'
    } else if (downloadType === 'vtt') {
      /**
       * WEBVTT title
       *
       * 1
       * 00:05:00.400 --> 00:05:15.300
       * This is an example of
       * a subtitle.
       *
       * 2
       * 00:05:16.400 --> 00:05:25.300
       * This is an example of
       * a subtitle - 2nd subtitle.
       */
      s = `WEBVTT ${title ?? ''}\n\n`
      for (const item of data.body) {
        const ss = (item.idx + 1) + '\n' + formatVttTime(item.from) + ' --> ' + formatVttTime(item.to) + '\n' + ((item.content?.trim()) ?? '') + '\n\n'
        s += ss
      }
      s = s.substring(0, s.length - 1)// remove last '\n'
      suffix = 'vtt'
    } else if (downloadType === 'json') {
      s = JSON.stringify(data)
      suffix = 'json'
    } else if (downloadType === 'summarize') {
      s = `${title??'无标题'}\n${url??'无链接'}\n${author??'无作者'} ${time}\n\n`
      const [success, content] = getSummarize(title, segments, curSummaryType)
      if (!success) return
      s += content
      fileName += ' - 总结'
      suffix = 'txt'
    } else {
      return
    }
    if (download) {
      downloadText(s, fileName+'.'+suffix)
    } else {
      navigator.clipboard.writeText(s).then(() => {
        toast.success('复制成功')
      }).catch(console.error)
    }
    setMoreVisible(false)
  }, [author, ctime, curSummaryType, data, downloadType, segments, title, url])

  const downloadAudioCallback = useCallback(() => {
    sendInject(null, 'DOWNLOAD_AUDIO', {})
  }, [sendInject])

  const selectCallback = useCallback((e: any) => {
    dispatch(setTempData({
      downloadType: e.target.value,
    }))
  }, [dispatch])

  const preventCallback = useCallback((e: any) => {
    e.stopPropagation()
  }, [])

  const moreCallback = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    if (!envData.flagDot) {
      dispatch(setEnvData({
        ...envData,
        flagDot: true,
      }))
    }
    setMoreVisible(!moreVisible)
    // 显示菜单时自动展开，防止菜单显示不全
    if (!moreVisible) {
      eventBus.emit({
        type: EVENT_EXPAND
      })
    }
  }, [dispatch, envData, eventBus, moreVisible])
  useClickAway(() => {
    setMoreVisible(false)
  }, moreRef)

  return <>
  <div ref={moreRef} onClick={moreCallback}>
    <div className='indicator flex items-center'>
      {envReady && !envData.flagDot && <span className="indicator-item bg-secondary w-1.5 h-1.5 rounded-full"></span>}
      <FiMoreVertical className='desc transform ease-in duration-300 hover:text-primary' title='更多'/>
    </div>
  </div>
  {moreVisible &&
    <Popover refElement={moreRef.current} className='bg-neutral text-neutral-content py-1 z-[1000]' options={{
      placement
    }}>
      <ul className='menu menu-compact'>
        <li className='hover:bg-accent'>
          <a className='flex items-center' onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            downloadCallback(false)
          }}>
            <RiFileCopy2Line className='w-[20px] h-[20px] text-primary/75 bg-white rounded-sm p-0.5'/>
            复制
            <select className='select select-ghost select-xs' value={downloadType} onChange={selectCallback}
                    onClick={preventCallback}>
              {DownloadTypes?.map((item: any) => <option key={item.type} value={item.type}>{item.name}</option>)}
            </select>
          </a>
        </li>
        <li className='hover:bg-accent'>
          <a className='flex items-center' onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            downloadCallback(true)
          }}>
            <ImDownload3 className='w-[20px] h-[20px] text-primary/75 bg-white rounded-sm p-0.5'/>
            下载
            <select className='select select-ghost select-xs' value={downloadType} onChange={selectCallback}
                    onClick={preventCallback}>
              {DownloadTypes?.map((item: any) => <option key={item.type} value={item.type}>{item.name}</option>)}
            </select>
          </a>
        </li>
        <li className='hover:bg-accent'>
          <a className='flex items-center' onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            downloadAudioCallback()
          }}>
            <ImDownload3 className='w-[20px] h-[20px] text-primary/75 bg-white rounded-sm p-0.5'/>
            下载音频(m4s)
          </a>
        </li>
        {/* <li className='hover:bg-accent'>
          <a className='flex items-center' onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            openUrl('https://jq.qq.com/?_wv=1027&k=RJyFABPF')
          }}>
            <BsFillChatDotsFill className='w-[20px] h-[20px] text-primary/75 bg-white rounded-sm p-0.5'/>
            QQ交流群(194536885)
          </a>
        </li>
        <li className='hover:bg-accent'>
          <a className='flex items-center' onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            openUrl('https://static.ssstab.com/images/indiekky_public.png')
          }}>
            <AiFillWechat className='w-[20px] h-[20px] text-primary/75 bg-white rounded-sm p-0.5'/>
            微信公众号(IndieKKY)
          </a>
        </li> */}
        {/* <li className='hover:bg-accent'> */}
        {/*  <a className='flex items-center' onClick={(e) => { */}
        {/*    e.preventDefault() */}
        {/*    e.stopPropagation() */}
        {/*    openUrl('https://bibigpt.co/r/bilibili') */}
        {/*  }}> */}
        {/*    <img alt='BibiGPT' src='/bibigpt.png' className='w-[20px] h-[20px] bg-white rounded-sm p-0.5'/> */}
        {/*    BibiGPT */}
        {/*  </a> */}
        {/* </li> */}
        {/* <li className='hover:bg-accent'> */}
        {/*  <a className='flex items-center' onClick={(e) => { */}
        {/*    e.preventDefault() */}
        {/*    e.stopPropagation() */}
        {/*    openUrl('https://chromewebstore.google.com/detail/fiaeclpicddpifeflpmlgmbjgaedladf') */}
        {/*  }}> */}
        {/*    <img alt='youtube subtitle' src='/youtube-caption.png' */}
        {/*         className='w-[20px] h-[20px] bg-white rounded-sm p-0.5'/> */}
        {/*    Youtube Caption */}
        {/*  </a> */}
        {/* </li> */}
        <li className='hover:bg-accent'>
          <a className='flex items-center' onClick={(e) => {
            chrome.runtime.openOptionsPage()
            setMoreVisible(false)
            e.preventDefault()
            e.stopPropagation()
          }}>
            <IoMdSettings className='w-[20px] h-[20px] text-primary/75 bg-white rounded-sm p-0.5'/>
            选项
          </a>
        </li>
        {/* 官网 */}
        <li className='hover:bg-accent'>
          <a className='flex items-center' onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            openUrl('https://www.bibijun.cc')
          }}>
            <img alt='哔哔君' src='/favicon-128x128.png' className='w-[20px] h-[20px] bg-white rounded-sm p-0.5'/>
            🏠 哔哔君官网
          </a>
        </li>
      </ul>
    </Popover>}
  </>
}

export default MoreBtn
