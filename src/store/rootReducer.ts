import { combineReducers } from '@reduxjs/toolkit'
import { api } from '@/services/api'
import authReducer from './authSlice'
import uiReducer from './uiSlice'

export const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: authReducer,
  ui: uiReducer,
})
