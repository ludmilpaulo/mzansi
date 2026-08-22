import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { getApiBaseUrl, isApiSuccess, readApiError, unwrapEnvelope } from "@/lib/api";
import { persistSession, signOut, type AuthState } from "@/store/authSlice";
import type { ApiErrorBody, TokenRefreshResponse } from "@/types/api";

interface AuthAwareState {
  auth: AuthState;
}

export interface SerializedApiError {
  status: number | string;
  data: ApiErrorBody;
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

function toSerializedError(error: FetchBaseQueryError): SerializedApiError {
  if (error.status === "FETCH_ERROR") {
    return { status: error.status, data: { code: "network_error", detail: error.error || "Network error." } };
  }
  if (error.status === "TIMEOUT_ERROR") {
    return { status: error.status, data: { code: "timeout", detail: error.error || "Request timed out." } };
  }
  if (error.status === "PARSING_ERROR") {
    return { status: error.status, data: { code: "parse_error", detail: error.error || "Unexpected API response." } };
  }
  if (error.status === "CUSTOM_ERROR") {
    return { status: error.status, data: readApiError(error.data) };
  }
  return { status: error.status, data: readApiError(error.data) };
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

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, SerializedApiError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken(api, extraOptions).finally(() => {
        refreshPromise = null;
      });
    }
    const access = await refreshPromise;
    if (!access) {
      await api.dispatch(signOut());
      return { error: toSerializedError(result.error) };
    }
    result = await rawBaseQuery(args, api, extraOptions);
  }

  if (result.error) {
    return { error: toSerializedError(result.error) };
  }

  try {
    return { data: unwrapEnvelope(result.data) };
  } catch (caught) {
    const detail = caught instanceof Error ? caught.message : "Unexpected API response.";
    return { error: { status: "CUSTOM_ERROR", data: { code: "parse_error", detail } } };
  }
};
