import { createSlice } from '@reduxjs/toolkit'

interface UiState {
  /** Mobile sidebar drawer open state. */
  sidebarOpen: boolean
}

const initialState: UiState = {
  sidebarOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebar(state, action: { payload: boolean }) {
      state.sidebarOpen = action.payload
    },
  },
})

export const { toggleSidebar, setSidebar } = uiSlice.actions
export default uiSlice.reducer
