import {configureStore} from '@reduxjs/toolkit'
import envReducer from './redux/envReducer'
import currentTimeReducer from './redux/currentTimeReducer'

const store = configureStore({
  reducer: {
    env: envReducer,
    currentTime: currentTimeReducer,
  },
})

export default store
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
