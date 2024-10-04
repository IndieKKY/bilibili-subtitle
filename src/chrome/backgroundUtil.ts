export const broadcastMessage = async (ignoreTabIds: number[] | undefined | null, target: string, method: string, params?: any) => {
  const tabs = await chrome.tabs.query({
    discarded: false,
  })
  for (const tab of tabs) {
    try {
      if (tab.id && ((ignoreTabIds == null) || !ignoreTabIds.includes(tab.id))) {
        await chrome.tabs.sendMessage(tab.id, {target, method, params})
      }
    } catch (e) {
      console.error('send message to tab error', tab.id, e)
    }
  }
}
