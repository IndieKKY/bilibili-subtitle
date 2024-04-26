const {TOTAL_HEIGHT_DEF, HEADER_HEIGHT, TOTAL_HEIGHT_MIN, TOTAL_HEIGHT_MAX, IFRAME_ID} = require("../const");
var totalHeight = TOTAL_HEIGHT_DEF

const getVideoElement = () => {
  const videoWrapper = document.getElementById('bilibili-player')
  return videoWrapper.querySelector('video')
}

const timerIframe = setInterval(function () {
  var danmukuBox = document.getElementById('danmukuBox')
  if (danmukuBox) {
    clearInterval(timerIframe)

    //延迟插入iframe（插入太快，网络较差时容易出现b站网页刷新，原因暂时未知，可能b站的某种机制？）
    setTimeout(() => {
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
      iframe.style = 'border: none; width: 100%; height: 44px;margin-bottom: 3px;'
      iframe.allow = 'clipboard-read; clipboard-write;'
      if (vKey) {
        iframe.dataset[vKey] = danmukuBox?.dataset[vKey]
      }
      //insert before first child
      danmukuBox?.insertBefore(iframe, danmukuBox?.firstChild)

      console.debug('iframe inserted')
    }, 1500)
  }
}, 1000)

let aid = 0
let title = ''
let pages = []
let pagesMap = {}

let lastAidOrBvid = null
const refreshVideoInfo = async () => {
  const iframe = document.getElementById(IFRAME_ID)
  if (!iframe) return

  // fix: https://github.com/IndieKKY/bilibili-subtitle/issues/5
  // 处理稍后再看的url( https://www.bilibili.com/list/watchlater?bvid=xxx&oid=xxx )
  const pathSearchs = {}
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
        aid = aidOrBvid.slice(2)
        pages = await fetch(`https://api.bilibili.com/x/player/pagelist?aid=${aid}`, {credentials: 'include'}).then(res => res.json()).then(res => res.data)
        cid = pages[0].cid
        title = pages[0].part
        await fetch(`https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${cid}`, {credentials: 'include'}).then(res => res.json()).then(res => {
          subtitles = res.data.subtitle.subtitles
        })
      } else {//bvxxx
        await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${aidOrBvid}`, {credentials: 'include'}).then(res => res.json()).then(async res => {
          title = res.data.title
          aid = res.data.aid
          cid = res.data.cid
          pages = res.data.pages
        })
        await fetch(`https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${cid}`, {credentials: 'include'}).then(res => res.json()).then(res => {
          subtitles = res.data.subtitle.subtitles
        })
      }

      //pagesMap
      pagesMap = {}
      pages.forEach(page => {
        pagesMap[page.page + ''] = page
      })

      console.debug('refreshVideoInfo: ', aid, cid, pages, subtitles)

      //send setVideoInfo
      iframe.contentWindow.postMessage({
        type: 'setVideoInfo',
        url: location.origin + location.pathname,
        title,
        aid,
        pages,
        infos: subtitles,
      }, '*')
    }
  }
}

let lastAid = null
let lastCid = null
const refreshSubtitles = () => {
  const iframe = document.getElementById(IFRAME_ID)
  if (!iframe) return

  const urlSearchParams = new URLSearchParams(window.location.search)
  const p = urlSearchParams.get('p') || 1
  const page = pagesMap[p]
  if (!page) return
  const cid = page.cid

  if (aid !== lastAid || cid !== lastCid) {
    console.debug('refreshSubtitles', aid, cid)

    lastAid = aid
    lastCid = cid
    if (aid && cid) {
      fetch(`https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${cid}`, {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(res => {
          // console.log('refreshSubtitles: ', aid, cid, res)
          iframe.contentWindow.postMessage({
            type: 'setInfos',
            infos: res.data.subtitle.subtitles
          }, '*')
        })
    }
  }
}

// 监听消息
window.addEventListener("message", (event) => {
  const {data} = event

  if (data.type === 'fold') {
    const iframe = document.getElementById(IFRAME_ID)
    iframe.style.height = (data.fold ? HEADER_HEIGHT : totalHeight) + 'px'
  }

  if (data.type === 'move') {
    const video = getVideoElement()
    if (video) {
      video.currentTime = data.time
      if (data.togglePause) {
        video.paused ? video.play() : video.pause()
      }
    }
  }

  //刷新视频信息
  if (data.type === 'refreshVideoInfo') {
    refreshVideoInfo().catch(console.error)
  }
  //刷新字幕
  if (data.type === 'refreshSubtitles') {
    refreshSubtitles()
  }
  if (data.type === 'getSubtitle') {
    let url = data.info.subtitle_url
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://')
    }
    fetch(url).then(res => res.json()).then(res => {
      event.source.postMessage({
        data: {
          info: data.info,
          data: res,
        }, type: 'setSubtitle'
      }, '*')
    })
  }

  if (data.type === 'getCurrentTime') {
    const video = getVideoElement()
    if (video) {
      event.source.postMessage({
        data: {
          currentTime: video.currentTime
        }, type: 'setCurrentTime'
      }, '*')
    }
  }

  if (data.type === 'getSettings') {
    const videoElement = getVideoElement()
    totalHeight = videoElement ? Math.min(Math.max(videoElement.offsetHeight, TOTAL_HEIGHT_MIN), TOTAL_HEIGHT_MAX) : TOTAL_HEIGHT_DEF
    event.source.postMessage({
      data: {
        noVideo: !videoElement,
        totalHeight,
      }, type: 'setSettings'
    }, '*')
  }

  if (data.type === 'downloadAudio') {
    const html = document.getElementsByTagName('html')[0].innerHTML
    const playInfo = JSON.parse(html.match(/window.__playinfo__=(.+?)<\/script/)[1])
    const audioUrl = playInfo.data.dash.audio[0].baseUrl

    fetch(audioUrl).then(res => res.blob()).then(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${title}.m4s`
      a.click()
    })
  }

  if (data.type === 'updateTransResult') {
    const trans = data.result??''
    let text = document.getElementById('trans-result-text')
    if (text) {
      text.innerHTML = trans
    } else {
      const container = document.getElementsByClassName('bpx-player-subtitle-panel-wrap')?.[0]
      if (container) {
        const div = document.createElement('div')
        div.style.display = 'flex'
        div.style.justifyContent = 'center'
        div.style.margin = '2px'
        text = document.createElement('text')
        text.id = 'trans-result-text'
        text.innerHTML = trans
        text.style.fontSize = '1rem'
        text.style.padding = '5px'
        text.style.color = 'white'
        text.style.background = 'rgba(0, 0, 0, 0.4)'
        div.append(text)

        container.append(div)
      }
    }
    text && (text.style.display = trans ? 'block' : 'none')
  }
}, false);

setInterval(() => {
  refreshVideoInfo().catch(console.error)
  refreshSubtitles()
}, 1000)
