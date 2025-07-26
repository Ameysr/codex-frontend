// authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from './utils/axiosClient';



export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/register', userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
        status: error.response?.status
      });
    }
  }
);

// Fixed loginUser implementation
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/login', credentials);
      return response.data.user;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
        status: error.response?.status
      });
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/user/check');
      return data.user;
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue({ isUnauthorized: true });
      }
      return rejectWithValue(getSerializableError(error));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post('/user/logout');
      return null;
    } catch (error) {
      return rejectWithValue(getSerializableError(error));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register User Cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.isAuthenticated = false;
        state.user = null;
      })
  
      // Login User Cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.isAuthenticated = false;
        state.user = null;
      })
  
      // Check Auth Cases
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        
        // Special handling for 401 - not an actual error
        if (action.payload?.isUnauthorized) {
          state.isAuthenticated = false;
          state.user = null;
          state.error = null;
        } else {
          state.error = action.payload?.message || 'Authentication check failed';
          state.isAuthenticated = false;
          state.user = null;
        }
      })
  
      // Logout User Cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Logout failed';
        state.isAuthenticated = false;
        state.user = null;
      });
  }
});

// Export actions including clearError
export const { clearError } = authSlice.actions;

// Export reducer as default
export default authSlice.reducer;