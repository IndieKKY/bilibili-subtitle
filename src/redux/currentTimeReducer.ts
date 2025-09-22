import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CurrentTimeState {
  currentTime?: number
}

const initialState: CurrentTimeState = {
  currentTime: undefined
}

export const slice = createSlice({
  name: 'currentTime',
  initialState,
  reducers: {
    setCurrentTime: (state, action: PayloadAction<number | undefined>) => {
      state.currentTime = action.payload
    }
  }
})

export const { setCurrentTime } = slice.actions

export default slice.reducer
