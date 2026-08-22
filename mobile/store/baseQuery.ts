import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import Constants from "expo-constants";

import type { TokenRefreshResponse } from "../types/api";
import { isApiSuccess } from "../utils/envelope";
import { persistSession, signOut, type AuthState } from "./authSlice";

interface AuthAwareState {
  auth: AuthState;
}

export function getApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra;
  if (extra && typeof extra === "object" && "apiBaseUrl" in extra && typeof extra.apiBaseUrl === "string") {
    return extra.apiBaseUrl.replace(/\/$/, "");
  }
  return (process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as AuthAwareState;
    if (state.auth.access) {
      headers.set("Authorization", `Bearer ${state.auth.access}`);
    }
    return headers;
  },
});

let refreshPromise: Promise<string | null> | null = null;

function readRefreshPayload(value: unknown): TokenRefreshResponse | null {
  const data = isApiSuccess<TokenRefreshResponse>(value) ? value.data : value;
  if (typeof data === "object" && data !== null && "access" in data && typeof data.access === "string") {
    const refresh = "refresh" in data && typeof data.refresh === "string" ? data.refresh : undefined;
    return { access: data.access, refresh };
  }
  return null;
}

async function refreshAccessToken(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2],
): Promise<string | null> {
  const state = api.getState() as AuthAwareState;
  const refresh = state.auth.refresh;
  if (!refresh) {
    return null;
  }
  const result = await rawBaseQuery(
    { url: "/auth/token/refresh", method: "POST", body: { refresh } },
    api,
    extraOptions,
  );
  if (result.error) {
    return null;
  }
  const tokens = readRefreshPayload(result.data);
  if (!tokens) {
    return null;
  }
  await api.dispatch(
    persistSession({
      access: tokens.access,
      refresh: tokens.refresh ?? refresh,
      user: state.auth.user,
    }),
  );
  return tokens.access;
}

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  const status = result.error?.status;
  if (status !== 401) {
    return result;
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken(api, extraOptions).finally(() => {
      refreshPromise = null;
    });
  }
  const access = await refreshPromise;
  if (!access) {
    await api.dispatch(signOut());
    return result;
  }
  result = await rawBaseQuery(args, api, extraOptions);
  return result;
};
