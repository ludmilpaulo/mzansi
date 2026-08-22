import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { clearStoredAuth, readStoredAuth, writeStoredAuth } from "@/lib/auth-storage";
import type { MeUser, User } from "@/types/api";

export type AuthUser = User | MeUser;

export interface AuthState {
  access: string | null;
  refresh: string | null;
  user: AuthUser | null;
  hydrated: boolean;
}

export interface SessionPayload {
  access: string;
  refresh: string;
  user?: AuthUser | null;
}

const initialState: AuthState = {
  access: null,
  refresh: null,
  user: null,
  hydrated: false,
};

export const hydrateAuth = createAsyncThunk("auth/hydrate", async () => {
  return readStoredAuth();
});

export const persistSession = createAsyncThunk("auth/persistSession", async (payload: SessionPayload) => {
  writeStoredAuth({
    access: payload.access,
    refresh: payload.refresh,
    user: payload.user ?? null,
  });
  return payload;
});

export const signOut = createAsyncThunk("auth/signOut", async () => {
  clearStoredAuth();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<SessionPayload>) {
      state.access = action.payload.access;
      state.refresh = action.payload.refresh;
      if (action.payload.user !== undefined) {
        state.user = action.payload.user;
      }
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      if (state.access && state.refresh) {
        writeStoredAuth({ access: state.access, refresh: state.refresh, user: action.payload });
      }
    },
    clearSession(state) {
      state.access = null;
      state.refresh = null;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.access = action.payload.access;
          state.refresh = action.payload.refresh;
          state.user = action.payload.user;
        }
        state.hydrated = true;
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.hydrated = true;
      })
      .addCase(persistSession.fulfilled, (state, action) => {
        state.access = action.payload.access;
        state.refresh = action.payload.refresh;
        if (action.payload.user !== undefined) {
          state.user = action.payload.user;
        }
      })
      .addCase(signOut.fulfilled, (state) => {
        state.access = null;
        state.refresh = null;
        state.user = null;
      });
  },
});

export const { setCredentials, setUser, clearSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
