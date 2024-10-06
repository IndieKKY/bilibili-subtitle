import { TOTAL_HEIGHT_DEF, HEADER_HEIGHT, TOTAL_HEIGHT_MIN, TOTAL_HEIGHT_MAX, IFRAME_ID, MESSAGE_TO_INJECT_DOWNLOAD_AUDIO, MESSAGE_TO_APP_SET_INFOS, MESSAGE_TO_INJECT_TOGGLE_DISPLAY, STORAGE_ENV, MESSAGE_TO_EXTENSION_SHOW_FLAG } from '@/consts/const'
import { MESSAGE_TO_INJECT_FOLD, MESSAGE_TO_INJECT_MOVE, MESSAGE_TO_INJECT_GET_SUBTITLE, MESSAGE_TO_INJECT_GET_VIDEO_STATUS, MESSAGE_TO_INJECT_GET_VIDEO_ELEMENT_INFO, MESSAGE_TO_INJECT_UPDATETRANSRESULT, MESSAGE_TO_INJECT_PLAY, MESSAGE_TO_INJECT_HIDE_TRANS, MESSAGE_TO_INJECT_REFRESH_VIDEO_INFO } from '@/consts/const'
import InjectMessaging from '@/messaging/layer2/InjectMessaging'

const debug = (...args: any[]) => {
  console.debug('[Inject]', ...args)
}

(async function () {
  // 如果路径不是/video或/list，则不注入
  if (!location.pathname.startsWith('/video') && !location.pathname.startsWith('/list')) {
    debug('Not inject')
    return
  }

  //读取envData
  const envDataStr = (await chrome.storage.sync.get(STORAGE_ENV))[STORAGE_ENV]
  let sidePanel: boolean | null = null
  let manualInsert: boolean | null = null
  if (envDataStr) {
    try {
      const envData = JSON.parse(envDataStr)
      debug('envData: ', envData)

      sidePanel = envData.sidePanel
      manualInsert = envData.manualInsert
    } catch (error) {
      console.error('Error parsing envData:', error)
    }
  }

  const runtime: {
    injectMessaging: InjectMessaging
    // lastV?: string | null
    // lastVideoInfo?: VideoInfo

    fold: boolean

    videoElement?: HTMLVideoElement
    videoElementHeight: number

    showTrans: boolean
    curTrans?: string
  } = {
    injectMessaging: new InjectMessaging(),
    fold: true,
    videoElementHeight: TOTAL_HEIGHT_DEF,
    showTrans: false,
  }

  const getVideoElement = () => {
    const videoWrapper = document.getElementById('bilibili-player')
    return videoWrapper?.querySelector('video') as HTMLVideoElement | undefined
  }

  /**
   * @return if changed
   */
  const refreshVideoElement = () => {
    const newVideoElement = getVideoElement()
    const newVideoElementHeight = (newVideoElement != null) ? (Math.min(Math.max(newVideoElement.offsetHeight, TOTAL_HEIGHT_MIN), TOTAL_HEIGHT_MAX)) : TOTAL_HEIGHT_DEF
    if (newVideoElement === runtime.videoElement && Math.abs(newVideoElementHeight - runtime.videoElementHeight) < 1) {
      return false
    } else {
      runtime.videoElement = newVideoElement
      runtime.videoElementHeight = newVideoElementHeight
      // update iframe height
      updateIframeHeight()
      return true
    }
  }

  const createIframe = () => {
    var danmukuBox = document.getElementById('danmukuBox')
    if (danmukuBox) {
      var vKey = ''
      for (const key in danmukuBox?.dataset) {
        if (key.startsWith('v-')) {
          vKey = key
          break
        }
      }

      const iframe = document.createElement('iframe')
      iframe.id = IFRAME_ID
      iframe.src = chrome.runtime.getURL('index.html')
      iframe.style.border = 'none'
      iframe.style.width = '100%'
      iframe.style.height = '44px'
      iframe.style.marginBottom = '3px'
      iframe.allow = 'clipboard-read; clipboard-write;'

      if (vKey) {
        iframe.dataset[vKey] = danmukuBox?.dataset[vKey]
      }

      //insert before first child
      danmukuBox?.insertBefore(iframe, danmukuBox?.firstChild)

      // show badge
      runtime.injectMessaging.sendExtension('SHOW_FLAG', {
        show: true
      })

      debug('iframe inserted')

      return iframe
    }
  }

  if (!sidePanel && !manualInsert) {
    const timerIframe = setInterval(function () {
      var danmukuBox = document.getElementById('danmukuBox')
      if (danmukuBox) {
        clearInterval(timerIframe)

        //延迟插入iframe（插入太快，网络较差时容易出现b站网页刷新，原因暂时未知，可能b站的某种机制？）
        setTimeout(createIframe, 1500)
      }
    }, 1000)
  }

  let aid: number | null = null
  let title = ''
  let pages: any[] = []
  let pagesMap: Record<string, any> = {}

  let lastAidOrBvid: string | null = null
  const refreshVideoInfo = async (force: boolean = false) => {
    if (force) {
      lastAidOrBvid = null
    }
    if (!sidePanel) {
      const iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement | undefined
      if (!iframe) return
    }

    // fix: https://github.com/IndieKKY/bilibili-subtitle/issues/5
    // 处理稍后再看的url( https://www.bilibili.com/list/watchlater?bvid=xxx&oid=xxx )
    const pathSearchs: Record<string, string> = {}
    location.search.slice(1).replace(/([^=&]*)=([^=&]*)/g, (matchs, a, b, c) => pathSearchs[a] = b)

    // bvid
    let aidOrBvid = pathSearchs.bvid // 默认为稍后再看
    if (!aidOrBvid) {
      let path = location.pathname
      if (path.endsWith('/')) {
        path = path.slice(0, -1)
      }
      const paths = path.split('/')
      aidOrBvid = paths[paths.length - 1]
    }

    if (aidOrBvid !== lastAidOrBvid) {
      // console.debug('refreshVideoInfo')

      lastAidOrBvid = aidOrBvid
      if (aidOrBvid) {
        //aid,pages
        let cid
        let subtitles
        if (aidOrBvid.toLowerCase().startsWith('av')) {//avxxx
          aid = parseInt(aidOrBvid.slice(2))
          pages = await fetch(`https://api.bilibili.com/x/player/pagelist?aid=${aid}`, { credentials: 'include' }).then(res => res.json()).then(res => res.data)
          cid = pages[0].cid
          title = pages[0].part
          await fetch(`https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${cid}`, { credentials: 'include' }).then(res => res.json()).then(res => {
            subtitles = res.data.subtitle.subtitles
          })
        } else {//bvxxx
          await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${aidOrBvid}`, { credentials: 'include' }).then(res => res.json()).then(async res => {
            title = res.data.title
            aid = res.data.aid
            cid = res.data.cid
            pages = res.data.pages
          })
          await fetch(`https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${cid}`, { credentials: 'include' }).then(res => res.json()).then(res => {
            subtitles = res.data.subtitle.subtitles
          })
        }

        //pagesMap
        pagesMap = {}
        pages.forEach(page => {
          pagesMap[page.page + ''] = page
        })

        debug('refreshVideoInfo: ', aid, cid, pages, subtitles)

        //send setVideoInfo
        runtime.injectMessaging.sendApp('SET_VIDEO_INFO', {
          url: location.origin + location.pathname,
          title,
          aid,
          pages,
          infos: subtitles,
        })
      }
    }
  }

  let lastAid: number | null = null
  let lastCid: number | null = null
  const refreshSubtitles = () => {
    if (!sidePanel) {
      const iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement | undefined
      if (!iframe) return
    }

    const urlSearchParams = new URLSearchParams(window.location.search)
    const p = urlSearchParams.get('p') || 1
    const page = pagesMap[p]
    if (!page) return
    const cid = page.cid

    if (aid !== lastAid || cid !== lastCid) {
      debug('refreshSubtitles', aid, cid)

      lastAid = aid
      lastCid = cid
      if (aid && cid) {
        fetch(`https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${cid}`, {
          credentials: 'include',
        })
          .then(res => res.json())
          .then(res => {
            // console.log('refreshSubtitles: ', aid, cid, res)
            runtime.injectMessaging.sendApp('SET_INFOS', {
              infos: res.data.subtitle.subtitles
            })
          })
      }
    }
  }

  const updateIframeHeight = () => {
    const iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement | undefined
    if (iframe != null) {
      iframe.style.height = (runtime.fold ? HEADER_HEIGHT : runtime.videoElementHeight) + 'px'
    }
  }

  const methods: {
    [key: string]: (params: any, context: MethodContext) => Promise<any>
  } = {
    [MESSAGE_TO_INJECT_TOGGLE_DISPLAY]: async (params) => {
      const iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement | undefined
      if (iframe != null) {
        iframe.style.display = iframe.style.display === 'none' ? 'block' : 'none'
        runtime.injectMessaging.sendExtension('SHOW_FLAG', {
          show: iframe.style.display !== 'none'
        })
      } else {
        createIframe()
      }
    },
    [MESSAGE_TO_INJECT_FOLD]: async (params) => {
      runtime.fold = params.fold
      updateIframeHeight()
    },
    [MESSAGE_TO_INJECT_MOVE]: async (params) => {
      const video = getVideoElement()
      if (video != null) {
        video.currentTime = params.time
        if (params.togglePause) {
          video.paused ? video.play() : video.pause()
        }
      }
    },
    [MESSAGE_TO_INJECT_GET_SUBTITLE]: async (params) => {
      let url = params.info.subtitle_url
      if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://')
      }
      return await fetch(url).then(res => res.json())
    },
    [MESSAGE_TO_INJECT_GET_VIDEO_STATUS]: async (params) => {
      const video = getVideoElement()
      if (video != null) {
        return {
          paused: video.paused,
          currentTime: video.currentTime
        }
      }
    },
    [MESSAGE_TO_INJECT_GET_VIDEO_ELEMENT_INFO]: async (params) => {
      refreshVideoElement()
      return {
        noVideo: runtime.videoElement == null,
        totalHeight: runtime.videoElementHeight,
      }
    },
    [MESSAGE_TO_INJECT_REFRESH_VIDEO_INFO]: async (params) => {
      refreshVideoInfo(params.force)
    },
    [MESSAGE_TO_INJECT_UPDATETRANSRESULT]: async (params) => {
      runtime.showTrans = true
      runtime.curTrans = params?.result

      let text = document.getElementById('trans-result-text')
      if (text) {
        text.innerHTML = runtime.curTrans ?? ''
      } else {
        const container = document.getElementsByClassName('bpx-player-subtitle-panel-wrap')?.[0]
        if (container) {
          const div = document.createElement('div')
          div.style.display = 'flex'
          div.style.justifyContent = 'center'
          div.style.margin = '2px'
          text = document.createElement('text')
          text.id = 'trans-result-text'
          text.innerHTML = runtime.curTrans ?? ''
          text.style.fontSize = '1rem'
          text.style.padding = '5px'
          text.style.color = 'white'
          text.style.background = 'rgba(0, 0, 0, 0.4)'
          div.append(text)

          container.append(div)
        }
      }
      text && (text.style.display = runtime.curTrans ? 'block' : 'none')
    },
    [MESSAGE_TO_INJECT_HIDE_TRANS]: async (params) => {
      runtime.showTrans = false
      runtime.curTrans = undefined

      let text = document.getElementById('trans-result-text')
      if (text) {
        text.style.display = 'none'
      }
    },
    [MESSAGE_TO_INJECT_PLAY]: async (params) => {
      const { play } = params
      const video = getVideoElement()
      if (video != null) {
        if (play) {
          await video.play()
        } else {
          video.pause()
        }
      }
    },
    [MESSAGE_TO_INJECT_DOWNLOAD_AUDIO]: async (params) => {
      const html = document.getElementsByTagName('html')[0].innerHTML
      const playInfo = JSON.parse(html.match(/window.__playinfo__=(.+?)<\/script/)?.[1] ?? '{}')
      const audioUrl = playInfo.data.dash.audio[0].baseUrl

      fetch(audioUrl).then(res => res.blob()).then(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${title}.m4s`
        a.click()
      })
    },
  }

  // 初始化injectMessage
  runtime.injectMessaging.init(methods)

  setInterval(() => {
    if (!sidePanel) {
      const iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement | undefined
      if (!iframe || iframe.style.display === 'none') return
    }

    refreshVideoInfo().catch(console.error)
    refreshSubtitles()
  }, 1000)
})()
