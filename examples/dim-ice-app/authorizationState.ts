// The authentication state acts like a page but without a view. The model can be used by other components to adapt
// their behavior and view

import command, { Command } from "../../src/elmish/command";
import api from "./api/api";
import Application from "./api/models/apps/application";
import AccessTokenResponse from "./api/models/oauth/accessTokenResponse";
import { AccessToken } from "./api/models/string";
import Instance, { InstanceWithCredentials } from "./instance";
import {
  tryLoadAppCredentials,
  tryLoadAccessToken,
  saveAccessToken,
  saveAppCredentials,
} from "./localStorage";

export type AuthorizationStateMessage =
  | {
      readonly type: "set instance";
      readonly instance: Instance;
    }
  | {
      readonly type: "create app";
    }
  | {
      readonly type: "set app credentials";
      readonly app: Application;
    }
  | {
      // Navigate to mastodon authorization page in code flow to let user authorize the app
      readonly type: "navigate to authorization page";
    }
  | {
      // When the access token is loaded and needs to be verified
      // If not valid then we need to reauthorize
      readonly type: "verify credentials";
      readonly accessToken: AccessToken;
    }
  | {
      readonly type: "set access token";
      readonly token: AccessTokenResponse;
    }
  | { readonly type: "authorization completed"; accessToken: AccessToken };

// External message following good recommendations from https://medium.com/@MangelMaxime/my-tips-for-working-with-elmish-ab8d193d52fd
export type AuthorizationStateExternalMessage = {
  type: "authorization completed";
  accessToken: AccessToken;
  instance: Instance;
};

/**
 * Represents the errors that can occur. They are strings but can be complex objects if more information is required
 */
type AuthorizationError =
  /**
   * No code was provided when "/redirect" was opened. It should only be openend during an authorization code flow
   * and the code should be set as query parameter
   */
  "no code in query";

export type AuthorizationState =
  /**
   * When the app is opened the first time we don't have app credentials saved and the app needs to be registered with
   * the instance
   */
  (
    | { type: "no app credentials"; error?: AuthorizationError }
    /**
     * Creating the app and waiting for the response
     */
    | { type: "creating app" }
    /**
     * An app is registed but the user needs to authorize the app with the instance. We mostly navigate the user to the
     * authorization page or navigate after interaction
     */
    | ({ type: "authorization required" } & InstanceWithCredentials)
    /**
     * When the user gets redirected to the app from the authorization the url contains the code and we are exchanging it
     * for an access token
     */
    | ({ type: "running code exchange" } & InstanceWithCredentials)
    /**
     * App credentials and an existing access token were loaded and we are running the verification of the access token to
     * see if it is still valid. If it is no longer valid then we need to request authorization again.
     */
    | ({ type: "verifying credentials" } & InstanceWithCredentials)
    | ({
        type: "authorized";
        accessToken: AccessToken;
      } & InstanceWithCredentials)
  ) & { instance: Instance };

// Current location. Should not change while page is active
// Redirect url needs to be registered with app creation
const redirectUri = new URL("/redirect", location.href);

function startCodeExchange(
  instance: Instance,
  app: Application
): [AuthorizationState, Command<AuthorizationStateMessage>] {
  // Get code from url
  const currentLocation = new URL(location.href);
  const code = currentLocation.searchParams.get("code");
  // Remove code from url so we don't trigger another exchange accidentally
  currentLocation.searchParams.delete("code");
  // Reset path
  currentLocation.pathname = "";

  //TODO consider moving side effects into commands
  //TODO use new navigation api in chromium and fallback to old and crufty history
  history.replaceState({}, "", currentLocation.href);
  if (code === null) {
    // This is an error. We got navigated to redirect but did not get a code passed as query parameter
    // Though this is an expectable error as users can just open the app with "/redirect"
    // and very likely don't pass a valid authorization code in the query
    // There are many other reasons we can end up in this stateW

    return [
      {
        type: "no app credentials",
        error: "no code in query",
        instance,
      },
      command.none,
    ];
  }

  // Start async code exchange command (side effect)
  //TODO develop alternative functions that use function.apply with an arguments array.
  //TODO error handling
  // I just need to find out how to type this in TS
  // That way I can shorten the signature maybe, is this good?
  const exchangeCommand = command.ofPromise.perform(
    ({ base, code }) =>
      api.exchangeCodeForToken(
        base,
        redirectUri,
        code,
        app.client_id,
        app.client_secret
      ),
    { base: instance.baseUrl, code },
    (token: AccessTokenResponse): AuthorizationStateMessage => ({
      type: "set access token",
      token,
    })
  );

  return [{ type: "running code exchange", instance, app }, exchangeCommand];
}

function createInstanceBaseUrl(instance: string) {
  //TODO we should add some verification here because the string can be anything
  return new URL(`https://${instance}/`);
}

function createAuthorizationUrl(instanceBaseUrl: URL, clientId: string) {
  const authorizationUrl = new URL("/oauth/authorize", instanceBaseUrl);
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("scope", "read");
  //TODO make redirect go to url opened by user
  // When the user openes an url that they got send or saved as bookmark and are not signed in
  // they will currently be redirected to the start page after the code exchange happened.
  // They should instead be redirected to the link they originally opened
  authorizationUrl.searchParams.set("redirect_uri", redirectUri.toString());
  authorizationUrl.searchParams.set("response_type", "code");

  return authorizationUrl;
}

function initialize(): [
  AuthorizationState,
  Command<AuthorizationStateMessage>
] {
  // Try load app credentials, if we don't have app credentials we need to start onboarding again
  const credentials = tryLoadAppCredentials();
  if (credentials === undefined)
    return [
      {
        type: "no app credentials",
        instance: { baseUrl: createInstanceBaseUrl("mastodon.social") },
      },
      command.none,
    ];

  // Check if we are in authorization code flow
  // This takes precedence before trying to load an existing access token in case the user wants to authorize with
  // a different instance
  if (location.pathname === "/redirect")
    return startCodeExchange(credentials.instance, credentials.app);

  // Try to load existing access token
  const token = tryLoadAccessToken();
  // If we could not load it then we need to ask user for authorization again
  if (token === undefined)
    return [
      {
        type: "authorization required",
        app: credentials.app,
        instance: credentials.instance,
      },
      command.none,
    ];

  // Else verify credentials

  const verifyCredentialsCommand = command.ofMessage<AuthorizationStateMessage>(
    {
      type: "verify credentials",
      accessToken: token.access_token,
    }
  );

  return [
    {
      type: "verifying credentials",
      app: credentials.app,
      instance: credentials.instance,
    },
    verifyCredentialsCommand,
  ];
}

function update(
  message: AuthorizationStateMessage,
  model: AuthorizationState
): [
  AuthorizationState,
  Command<AuthorizationStateMessage>,
  AuthorizationStateExternalMessage?
] {
  switch (message.type) {
    case "set instance":
      // Might need to check if we already have app credentials

      const newCommand = command.ofMessage<AuthorizationStateMessage>({
        type: "create app",
      });

      return [
        { type: "no app credentials", instance: message.instance },
        newCommand,
      ];

    case "create app":
      // Create application on instance
      const createAppCommand = command.ofPromise.perform(
        () => api.createApp(model.instance.baseUrl, redirectUri),
        undefined,
        (app): AuthorizationStateMessage => ({
          type: "set app credentials",
          app,
        })
      );

      return [
        { type: "creating app", instance: model.instance },
        createAppCommand,
      ];

    case "set app credentials":
      // Save to local storage
      const instanceWithCredentials: InstanceWithCredentials = {
        instance: model.instance,
        app: message.app,
      };

      const persistCredentialsCommand = command.ofFunction.perform(
        saveAppCredentials,
        instanceWithCredentials,
        (): AuthorizationStateMessage => ({
          type: "navigate to authorization page",
        })
      );

      return [
        {
          app: instanceWithCredentials.app,
          instance: instanceWithCredentials.instance,
          type: "running code exchange",
        },
        persistCredentialsCommand,
      ];

    case "navigate to authorization page":
      if (!("app" in model)) {
        console.error("Invalid state, expected to have app");
        //TODO possible endless loop here
        return [
          { type: "no app credentials", instance: model.instance },
          // Go back to step before
          command.ofMessage<AuthorizationStateMessage>({ type: "create app" }),
        ];
      }

      const authorizationUrl = createAuthorizationUrl(
        model.instance.baseUrl,
        model.app.client_id
      );

      // Could consider starting termination to gracefully shut down running processes but at this point there
      // shouldn't be any
      const navigateCommand = command.ofEffect<AuthorizationStateMessage>(() =>
        globalThis.location.assign(authorizationUrl)
      );
      return [model, navigateCommand];

    // This is the case when we loaded existing credentials
    case "verify credentials":
      const verifyCommand = command.ofPromise.perform(
        () =>
          api.verifyCredentials(model.instance.baseUrl, message.accessToken),
        undefined,
        (result): AuthorizationStateMessage => {
          if ("error" in result)
            return { type: "navigate to authorization page" };

          return {
            type: "authorization completed",
            accessToken: message.accessToken,
          };
        }
      );

      return [model, verifyCommand];
    case "set access token":
      // Effect describes side effects which can be put into commands?
      const persistTokenCommand = command.ofFunction.perform(
        saveAccessToken,
        message.token,
        (): AuthorizationStateMessage => ({
          type: "authorization completed",
          accessToken: message.token.access_token,
        })
      );

      return [model, persistTokenCommand];
    case "authorization completed":
      if (
        model.type === "creating app" ||
        model.type === "no app credentials"
      ) {
        console.error("Unexpected completion of authorization");
        return [model, command.none];
      }

      return [
        {
          type: "authorized",
          accessToken: message.accessToken,
          instance: model.instance,
          app: model.app,
        },
        command.none,
        {
          type: "authorization completed",
          accessToken: message.accessToken,
          instance: model.instance,
        },
      ];
  }
}

const authorizationState = {
  initialize,
  update,
};

export default authorizationState;
