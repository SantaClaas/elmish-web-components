import Application from "./api/models/apps/application";
import AccessTokenResponse from "./api/models/oauth/accessTokenResponse";

const accessTokenStorageKey = "dim ice access token";
export function tryLoadAccessToken(): AccessTokenResponse | undefined {
  //TODO better differentiate errrors
  // We don't have persistent storage in incognito windows
  if (!("localStorage" in window)) return undefined;

  const value = localStorage.getItem(accessTokenStorageKey);
  if (value === null) return undefined;

  //TODO error handling
  return JSON.parse(value);
}

/**
 * Saves the access token to local storage
 */
export function saveAccessToken(token: AccessTokenResponse) {
  //TODO better differentiate errrors
  // We don't have persistent storage in incognito windows
  if (!("localStorage" in window)) return;

  const value = JSON.stringify(token);
  localStorage.setItem(accessTokenStorageKey, value);
}
const appCredentialsStorageKey = "dim ice app credentials";
export function tryLoadAppCredentials(): Application | undefined {
  //TODO better differentiate errrors
  // We don't have persistent storage in incognito windows
  if (!("localStorage" in window)) return undefined;

  const value = localStorage.getItem(appCredentialsStorageKey);
  if (value === null) return undefined;

  //TODO error handling
  return JSON.parse(value) as Application;
}

export function saveAppCredentials(app: Application) {
  //TODO better differentiate errrors
  // We don't have persistent storage in incognito windows
  if (!("localStorage" in window)) return;

  const value = JSON.stringify(app);
  localStorage.setItem(appCredentialsStorageKey, value);
}
