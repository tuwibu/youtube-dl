import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
export interface InitialState {
  pathFolder: string,
  channelId: string,
  cookie: string,
  thread: number,
}
const initialState: InitialState = {
  pathFolder: "",
  channelId: "",
  cookie: "",
  thread: 5,
};
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setPathFolder(state, action: PayloadAction<string>) {
      state.pathFolder = action.payload;
    },
    setChannelId(state, action: PayloadAction<string>) {
      state.channelId = action.payload;
    },
    setCookie(state, action: PayloadAction<string>) {
      state.cookie = action.payload;
    },
    setThread(state, action: PayloadAction<number>) {
      state.thread = action.payload;
    },
  }
})
export const { setPathFolder, setChannelId, setCookie, setThread } = authSlice.actions;
export default authSlice.reducer;