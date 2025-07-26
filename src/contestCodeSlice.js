
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Structure: { [contestId]: { [problemId]: { [language]: code } } }
  contestCodeStore: {}
};

const contestCodeSlice = createSlice({
  name: 'contestCode',
  initialState,
  reducers: {
    saveContestCode: (state, action) => {
      const { contestId, problemId, language, code } = action.payload;

      if (!state.contestCodeStore[contestId]) {
        state.contestCodeStore[contestId] = {};
      }

      if (!state.contestCodeStore[contestId][problemId]) {
        state.contestCodeStore[contestId][problemId] = {};
      }

      state.contestCodeStore[contestId][problemId][language] = code;
    },
    clearContestCode: (state, action) => {
      const { contestId, problemId } = action.payload;

      if (state.contestCodeStore[contestId] && state.contestCodeStore[contestId][problemId]) {
        delete state.contestCodeStore[contestId][problemId];

        // Clean up empty contest entry
        if (Object.keys(state.contestCodeStore[contestId]).length === 0) {
          delete state.contestCodeStore[contestId];
        }
      }
    }
  }
});

export const { saveContestCode, clearContestCode } = contestCodeSlice.actions;
export default contestCodeSlice.reducer;
