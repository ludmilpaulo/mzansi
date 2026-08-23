import { getApiBaseUrl, readApiError, unwrapEnvelope } from "@/lib/api";

export async function serverGet<T>(path: string): Promise<T> {
  const url = new URL(path.replace(/^\//, ""), `${getApiBaseUrl()}/`).toString();
  const response = await fetch(url, { cache: "no-store" });
  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  if (!response.ok) {
    throw new Error(readApiError(json).detail);
  }
  return unwrapEnvelope<T>(json);
}

export async function serverGetOrNull<T>(path: string): Promise<T | null> {
  try {
    return await serverGet<T>(path);
  } catch {
    return null;
  }
}
