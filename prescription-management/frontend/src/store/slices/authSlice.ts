import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../api';

interface AuthState {
  user: User | null;
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; tokens: AuthState['tokens'] }>) => {
      const { user, tokens } = action.payload;
      state.user = user;
      state.tokens = tokens;
      state.isAuthenticated = true;
      
      // Store tokens in localStorage
      if (tokens) {
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
      }
    },
    
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    
    updateTokens: (state, action: PayloadAction<{ access_token: string; token_type: string }>) => {
      if (state.tokens) {
        state.tokens.access_token = action.payload.access_token;
        state.tokens.token_type = action.payload.token_type;
        localStorage.setItem('access_token', action.payload.access_token);
      }
    },
    
    logout: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      
      // Clear localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    initializeAuth: (state) => {
      const access_token = localStorage.getItem('access_token');
      const refresh_token = localStorage.getItem('refresh_token');
      
      if (access_token && refresh_token) {
        state.tokens = {
          access_token,
          refresh_token,
          token_type: 'bearer',
        };
        state.isAuthenticated = true;
      }
    },
  },
});

export const {
  setCredentials,
  setUser,
  updateTokens,
  logout,
  setLoading,
  initializeAuth,
} = authSlice.actions;

export default authSlice.reducer;