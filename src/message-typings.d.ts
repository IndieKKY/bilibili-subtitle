//extension
interface ExtensionCloseSidePanelMessage extends ExtensionMessage {
    method: 'CLOSE_SIDE_PANEL';
  }
  
  interface ExtensionAddTaskMessage extends ExtensionMessage<{ taskDef: TaskDef }, Task> {
    method: 'ADD_TASK';
  }
  
  interface ExtensionGetTaskMessage extends ExtensionMessage<{ taskId: string }, {
    code: 'ok'
    task: Task
  } | {
    code: 'not_found'
  }> {
    method: 'GET_TASK';
  }
  
  interface ExtensionShowFlagMessage extends ExtensionMessage<{ show: boolean }> {
    method: 'SHOW_FLAG';
  }
  
  type AllExtensionMessages = ExtensionCloseSidePanelMessage | ExtensionAddTaskMessage | ExtensionGetTaskMessage | ExtensionShowFlagMessage
  



  //inject
  interface InjectToggleDisplayMessage extends InjectMessage<{}> {
    method: 'TOGGLE_DISPLAY';
  }
  
  interface InjectFoldMessage extends InjectMessage<{ fold: boolean }> {
    method: 'FOLD';
  }
  
  interface InjectMoveMessage extends InjectMessage<{ time: number, togglePause: boolean }> {
    method: 'MOVE';
  }
  
  interface InjectGetSubtitleMessage extends InjectMessage<{ info: any }> {
    method: 'GET_SUBTITLE';
  }
  
  interface InjectGetVideoStatusMessage extends InjectMessage<{}> {
    method: 'GET_VIDEO_STATUS';
  }
  
  interface InjectGetVideoElementInfoMessage extends InjectMessage<{}> {
    method: 'GET_VIDEO_ELEMENT_INFO';
  }
  
  interface InjectRefreshVideoInfoMessage extends InjectMessage<{ force: boolean }> {
    method: 'REFRESH_VIDEO_INFO';
  }
  
  interface InjectUpdateTransResultMessage extends InjectMessage<{ result: string }> {
    method: 'UPDATE_TRANS_RESULT';
  }
  
  interface InjectHideTransMessage extends InjectMessage<{}> {
    method: 'HIDE_TRANS';
  }
  
  interface InjectPlayMessage extends InjectMessage<{ play: boolean }> {
    method: 'PLAY';
  }
  
  interface InjectDownloadAudioMessage extends InjectMessage<{}> {
    method: 'DOWNLOAD_AUDIO';
  }
  
  type AllInjectMessages = InjectToggleDisplayMessage | InjectFoldMessage | InjectMoveMessage | InjectGetSubtitleMessage | InjectGetVideoStatusMessage | InjectGetVideoElementInfoMessage | InjectRefreshVideoInfoMessage | InjectUpdateTransResultMessage | InjectHideTransMessage | InjectPlayMessage | InjectDownloadAudioMessage
  


  
  //app
  interface AppSetInfosMessage extends AppMessage<{ infos: any }> {
    method: 'SET_INFOS';
  }
  
  interface AppSetVideoInfoMessage extends AppMessage<{ url: string, title: string, aid: number | null, ctime: number | null, author?: string, pages: any, infos: any }> {
    method: 'SET_VIDEO_INFO';
  }
  
  type AllAPPMessages = AppSetInfosMessage | AppSetVideoInfoMessage
  
  