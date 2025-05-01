import { TOTAL_HEIGHT_DEF, HEADER_HEIGHT, TOTAL_HEIGHT_MIN, TOTAL_HEIGHT_MAX, IFRAME_ID, STORAGE_ENV, DEFAULT_USE_PORT } from '@/consts/const'
import { AllExtensionMessages, AllInjectMessages, AllAPPMessages } from '@/message-typings'
import { InjectMessaging } from '@kky002/kky-message'

const debug = (...args: any[]) => {
  console.debug('[Inject]', ...args)
}

(async function () {
  // 如果路径不是/video或/list，则不注入
  if (!location.pathname.startsWith('/video') && !location.pathname.startsWith('/list')) {
    debug('Not inject')
    return
  }

  // 读取envData
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
    injectMessaging: InjectMessaging<AllExtensionMessages, AllInjectMessages, AllAPPMessages>
    // lastV?: string | null
    // lastVideoInfo?: VideoInfo

    fold: boolean

    videoElement?: HTMLVideoElement
    videoElementHeight: number

    showTrans: boolean
    curTrans?: string
  } = {
    injectMessaging: new InjectMessaging(DEFAULT_USE_PORT),
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

      // insert before first child
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

        // 延迟插入iframe（插入太快，网络较差时容易出现b站网页刷新，原因暂时未知，可能b站的某种机制？）
        setTimeout(createIframe, 1500)
      }
    }, 1000)
  }

  let aid: number | null = null
  let ctime: number | null = null
  let author: string | undefined
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
    // eslint-disable-next-line no-return-assign
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
        // aid,pages
        let cid: string | undefined
        let subtitles
        if (aidOrBvid.toLowerCase().startsWith('av')) { // avxxx
          aid = parseInt(aidOrBvid.slice(2))
          pages = await fetch(`https://api.bilibili.com/x/player/pagelist?aid=${aid}`, { credentials: 'include' }).then(async res => await res.json()).then(res => res.data)
          cid = pages[0].cid
          ctime = pages[0].ctime
          author = pages[0].owner?.name
          title = pages[0].part
          await fetch(`https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid!}`, { credentials: 'include' }).then(async res => await res.json()).then(res => {
            subtitles = res.data.subtitle.subtitles
          })
        } else { // bvxxx
          await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${aidOrBvid}`, { credentials: 'include' }).then(async res => await res.json()).then(async res => {
            title = res.data.title
            aid = res.data.aid
            cid = res.data.cid
            ctime = res.data.ctime
            author = res.data.owner?.name
            pages = res.data.pages
          })
          await fetch(`https://api.bilibili.com/x/player/wbi/v2?aid=${aid!}&cid=${cid!}`, { credentials: 'include' }).then(async res => await res.json()).then(res => {
            subtitles = res.data.subtitle.subtitles
          })
        }

        console.log("get subtitle url for aid", aid, "cid", cid, "author", author, "title", title); // fuyc
        chrome.storage.sync.set({ 'aid': aid, 'cid': cid }, function () {
          console.log('video id saved');
        });

        // pagesMap
        pagesMap = {}
        pages.forEach(page => {
          pagesMap[page.page + ''] = page
        })

        debug('refreshVideoInfo: ', aid, cid, pages, subtitles)

        // send setVideoInfo
        runtime.injectMessaging.sendApp(!!sidePanel, 'SET_VIDEO_INFO', {
          url: location.origin + location.pathname,
          title,
          aid,
          ctime,
          author,
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
    const cid: number | null = page.cid

    if (aid !== lastAid || cid !== lastCid) {
      debug('refreshSubtitles', aid, cid)

      lastAid = aid
      lastCid = cid
      if (aid && cid) {
        fetch(`https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`, {
          credentials: 'include',
        })
          .then(async res => await res.json())
          .then(res => {
            // remove elements with empty subtitle_url
            res.data.subtitle.subtitles = res.data.subtitle.subtitles.filter((item: any) => item.subtitle_url)
            if (res.data.subtitle.subtitles.length > 0) {
              runtime.injectMessaging.sendApp(!!sidePanel, 'SET_INFOS', {
                infos: res.data.subtitle.subtitles
              })
            }
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
    [K in AllInjectMessages['method']]: (params: Extract<AllInjectMessages, { method: K }>['params'], context: MethodContext) => Promise<any>
  } = {
    TOGGLE_DISPLAY: async (params) => {
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
    FOLD: async (params) => {
      runtime.fold = params.fold
      updateIframeHeight()
    },
    MOVE: async (params) => {
      const video = getVideoElement()
      if (video != null) {
        video.currentTime = params.time
        if (params.togglePause) {
          video.paused ? video.play() : video.pause()
        }
      }
    },
    GET_SUBTITLE: async (params) => {
      let url = params.info.subtitle_url
      if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://')
      }
      return await fetch(url).then(async res => await res.json())
    },
    GET_VIDEO_STATUS: async (params) => {
      const video = getVideoElement()
      if (video != null) {
        return {
          paused: video.paused,
          currentTime: video.currentTime
        }
      }
    },
    GET_VIDEO_ELEMENT_INFO: async (params) => {
      refreshVideoElement()
      return {
        noVideo: runtime.videoElement == null,
        totalHeight: runtime.videoElementHeight,
      }
    },
    REFRESH_VIDEO_INFO: async (params) => {
      refreshVideoInfo(params.force)
    },
    UPDATE_TRANS_RESULT: async (params) => {
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
    HIDE_TRANS: async (params) => {
      runtime.showTrans = false
      runtime.curTrans = undefined

      const text = document.getElementById('trans-result-text')
      if (text) {
        text.style.display = 'none'
      }
    },
    PLAY: async (params) => {
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
    DOWNLOAD_AUDIO: async (params) => {
      const html = document.getElementsByTagName('html')[0].innerHTML
      const playInfo = JSON.parse(html.match(/window.__playinfo__=(.+?)<\/script/)?.[1] ?? '{}')
      const audioUrl = playInfo.data.dash.audio[0].baseUrl

      fetch(audioUrl).then(async res => await res.blob()).then(blob => {
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
