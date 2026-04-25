import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CurrentTimeState {
  currentTime?: number
  playbackRate?: number
}

const initialState: CurrentTimeState = {
  currentTime: undefined,
  playbackRate: 1,
}

export const slice = createSlice({
  name: 'currentTime',
  initialState,
  reducers: {
    setCurrentTime: (state, action: PayloadAction<number | undefined>) => {
      state.currentTime = action.payload
    },
    setPlaybackRate: (state, action: PayloadAction<number | undefined>) => {
      state.playbackRate = action.payload ?? 1
    },
  }
})

export const { setCurrentTime, setPlaybackRate } = slice.actions

export default slice.reducer
