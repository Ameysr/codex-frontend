// src/features/codeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Structure: { [problemId]: { [language]: code } }
  codeStore: {}
};

const codeSlice = createSlice({
  name: 'code',
  initialState,
  reducers: {
    saveCode: (state, action) => {
      const { problemId, language, code } = action.payload;
      
      if (!state.codeStore[problemId]) {
        state.codeStore[problemId] = {};
      }
      
      state.codeStore[problemId][language] = code;
    },
    clearCode: (state, action) => {
      const { problemId } = action.payload;
      if (state.codeStore[problemId]) {
        delete state.codeStore[problemId];
      }
    }
  }
});

export const { saveCode, clearCode } = codeSlice.actions;
export default codeSlice.reducer;