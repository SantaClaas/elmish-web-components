import Application from "./models/apps/application";
import CreateAppRequest from "./models/apps/createAppRequest";
import VerifiyCredentialsError from "./models/apps/verificationError";
import VerifiedApplication from "./models/apps/verifiedApplication";
import GetHomeTimelineResponse, {
  parsePaginationLins,
} from "./models/getHomeTimelineResponse";
import AccessTokenRequest from "./models/oauth/accessTokenRequest";
import AccessTokenResponse from "./models/oauth/accessTokenResponse";
import Status from "./models/status";
import { AccessToken } from "./models/string";

async function fetchTootsFromUrl(
  url: URL | string,
  token: AccessToken
): Promise<GetHomeTimelineResponse> {
  //TODO error handling
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const linkHeader = response.headers.get("Link");
  // Assume they always exist
  const links = parsePaginationLins(linkHeader!);

  console.debug("Link 🔗 header", links);

  //TODO response code error handling
  return { links, toots: (await response.json()) as Status[] };
}

// Returns the stati posted to the home timeline
async function getHomeTimeline(
  instanceBaseUrl: URL,
  token: AccessToken
): Promise<GetHomeTimelineResponse> {
  const url = new URL("/api/v1/timelines/home", instanceBaseUrl);

  return await fetchTootsFromUrl(url, token);
}
async function exchangeCodeForToken(
  instanceBaseUrl: URL,
  redirectUri: URL,
  authorizationCode: string,
  clientId: string,
  clientSecret: string
): Promise<AccessTokenResponse> {
  const url = new URL("/oauth/token", instanceBaseUrl);
  const content: AccessTokenRequest = {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    code: authorizationCode,
    scope: "read",
  };

  //TODO error handling e.g. when we are offline or server refuses to respond

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(content),
  });

  //TODO handle error response from server e.g. 4xx or 5xx codes
  return (await response.json()) as AccessTokenResponse;
}

async function verifyCredentials(
  instanceBaseUrl: URL,
  accessToken: AccessToken
): Promise<VerifiedApplication | VerifiyCredentialsError> {
  const url = new URL("/api/v1/apps/verify_credentials", instanceBaseUrl);

  //TODO error handling
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.ok) return (await response.json()) as VerifiedApplication;

  if (response.status === 401)
    return (await response.json()) as VerifiyCredentialsError;

  throw new Error("Unexpected status code");
}

async function createApp(
  instanceBaseUrl: URL,
  redirectUri: URL
): Promise<Application> {
  const url = new URL("/api/v1/apps", instanceBaseUrl);

  const content: CreateAppRequest = {
    client_name: "dim ice 🧊",
    redirect_uris: redirectUri.toString(),
    scopes: "read",
    website: location.origin,
  };

  //TODO error handling
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(content),
  });

  return (await response.json()) as Application;
}

async function revokeToken(
  instanceBaseUrl: URL,
  token: AccessToken,
  clientId: string,
  clientSecret: string
) {
  const revokeUrl = new URL("/oauth/revoke", instanceBaseUrl);

  const data: FormData = new FormData();
  data.append("client_id", clientId);
  data.append("client_secret", clientSecret);
  data.append("token", token);

  await fetch(revokeUrl, {
    method: "POST",
    mode: "no-cors",
    body: data,
  });
}

const api = {
  getHomeTimeline,
  fetchTootsFromUrl,
  exchangeCodeForToken,
  verifyCredentials,
  createApp,
  revokeToken,
};
export default api;
