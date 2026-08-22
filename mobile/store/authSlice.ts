import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { deleteSecureItem, getSecureItem, setSecureItem } from "../services/secureStorage";
import type { MeUser, User } from "../types/api";

export const ACCESS_KEY = "mzansi.access";
export const REFRESH_KEY = "mzansi.refresh";

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
  const [access, refresh] = await Promise.all([getSecureItem(ACCESS_KEY), getSecureItem(REFRESH_KEY)]);
  return { access, refresh };
});

export const persistSession = createAsyncThunk("auth/persistSession", async (payload: SessionPayload) => {
  await Promise.all([setSecureItem(ACCESS_KEY, payload.access), setSecureItem(REFRESH_KEY, payload.refresh)]);
  return payload;
});

export const signOut = createAsyncThunk("auth/signOut", async () => {
  await Promise.all([deleteSecureItem(ACCESS_KEY), deleteSecureItem(REFRESH_KEY)]);
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
        state.access = action.payload.access;
        state.refresh = action.payload.refresh;
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
export { initialState as authInitialState };
