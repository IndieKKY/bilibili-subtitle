import { TAG_TARGET_APP } from './const'
import Layer1Protocol from './layer1/Layer1Protocol'

export const sendHandshakeFromApp = (pmh: Layer1Protocol) => {
  // 初始化
  // get tabId from url params
  const tabIdStr = window.location.search.split('tabId=')[1]
  const tabId = tabIdStr ? parseInt(tabIdStr) : undefined
  pmh.sendMessage({
    from: 'app',
    target: 'extension',
    method: '_HANDSHAKE',
    params: {
      tabId,
      tag: TAG_TARGET_APP,
    },
  })
}
