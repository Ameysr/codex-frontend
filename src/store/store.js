import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../authSlice';
import codeReducer from '../codeSlice';
import contestCodeReducer from '../contestCodeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    code: codeReducer,
    contestCode: contestCodeReducer
  }
});
