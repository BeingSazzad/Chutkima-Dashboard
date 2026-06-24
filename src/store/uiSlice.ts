import { createSlice } from '@reduxjs/toolkit'

interface UiState {
  /** Mobile sidebar drawer open state. */
  sidebarOpen: boolean
  /**
   * Dark store currently being managed; null = master view (all stores).
   * When a store is selected, its disabled feature-modules are hidden from nav.
   */
  activeStoreId: string | null
}

const initialState: UiState = {
  sidebarOpen: false,
  activeStoreId: null,
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
    setActiveStore(state, action: { payload: string | null }) {
      state.activeStoreId = action.payload
    },
  },
})

export const { toggleSidebar, setSidebar, setActiveStore } = uiSlice.actions
export default uiSlice.reducer
