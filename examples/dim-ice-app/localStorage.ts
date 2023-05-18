import AccessTokenResponse from "./api/models/oauth/accessTokenResponse";
import { InstanceWithCredentials } from "./instance";

function tryLoadAsJson<TValue>(key: string): TValue | undefined {
  //TODO better differentiate errors
  // We don't have persistent storage in incognito windows
  if (!("localStorage" in window)) return undefined;

  const value = localStorage.getItem(key);
  if (value === null) return undefined;

  //TODO error handling
  return JSON.parse(value) as TValue;
}

function saveAsJson<TValue>(key: string, value: TValue) {
  //TODO better differentiate errors
  // We don't have persistent storage in incognito windows
  if (!("localStorage" in window)) return;

  const json = JSON.stringify(value);
  localStorage.setItem(key, json);
}

const accessTokenStorageKey = "dim ice access token";

export function tryLoadAccessToken(): AccessTokenResponse | undefined {
  return tryLoadAsJson(accessTokenStorageKey);
}

/**
 * Saves the access token to local storage
 */
export function saveAccessToken(token: AccessTokenResponse) {
  saveAsJson(accessTokenStorageKey, token);
}

const appCredentialsStorageKey = "dim ice instance app credentials";

export function tryLoadAppCredentials(): InstanceWithCredentials | undefined {
  return tryLoadAsJson(appCredentialsStorageKey);
}

export function saveAppCredentials(app: InstanceWithCredentials) {
  saveAsJson(appCredentialsStorageKey, app);
}
