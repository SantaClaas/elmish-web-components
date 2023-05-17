import { RangeChangedEvent } from "@lit-labs/virtualizer";
import { TemplateResult, html, nothing } from "lit-html";
import command, { Command, Dispatch } from "../../../src/elmish/command";
import Application from "../api/models/apps/application";
import AccessTokenResponse from "../api/models/oauth/accessTokenResponse";
import Status from "../api/models/status";
import { AccessToken } from "../api/models/string";
import api from "../api/api";
import { saveAccessToken, saveAppCredentials } from "../localStorage";
import Instance, { InstanceWithCredentials } from "../instance";

// Current location. Should not change while page is active
// Redirect url needs to be registered with app creation
const redirectUri = new URL("/redirect", location.href);

export type WelcomePageMessage =
  | {
      readonly type: "set instance";
      readonly instance: string;
    }
  | {
      readonly type: "create app";
    }
  | {
      readonly type: "set app credentials";
      readonly app: Application;
    }
  | {
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
  | { readonly type: "navigate to home timeline" };

/**
 * Represents the errors that can occur. They are strings but can be complex objects if more information is required
 */
type AppError =
  /**
   * No code was provided when "/redirect" was opened. It should only be openend during an authorization code flow
   * and the code should be set as query parameter
   */
  | "noCodeRedirect"
  /**
   * The browser does not support APIs that are required by the app. The app should try to work and not completely block users
   * as it is very likely to still work even if incompatibility is detected. But the focus is to support modern browsers as of the time of writing.
   */
  | "outdatedBrowser";

// These types use tagged unions to emulate unions from F# or other more functional programming languages
type FirstOpen = {
  readonly type: "first open";
  readonly error?: AppError;
  readonly instance: Instance;
};

type CreatingApp = {
  readonly type: "creating app";
};

/**
 * Represents the state when the app was openend after a redirect from the authorization code flow
 */
type RunningCodeExchange = {
  readonly type: "running code exchange";
} & InstanceWithCredentials;

/**
 * Represents the state when the user was signed in at one point so that we already have app credentials but the users
 * access token is not valid (e.g. the token life time expired)
 */
type ReauthorizationRequired = {
  readonly type: "authorization required";
  readonly instance: Instance;
} & InstanceWithCredentials;

/**
 * Represents the state the app is in after existing access token was loaded
 */
type VerifyingCredentials = {
  readonly type: "verifying credentials";
} & InstanceWithCredentials;

export type WelcomePageModel = (
  | FirstOpen
  | CreatingApp
  | ReauthorizationRequired
  | RunningCodeExchange
  | VerifyingCredentials
) & { instance: Instance };

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

function update(
  message: WelcomePageMessage,
  model: WelcomePageModel
): [WelcomePageModel, Command<WelcomePageMessage>] {
  //   return [model, command.none];

  switch (message.type) {
    case "set instance":
      const instanceBaseUrl = createInstanceBaseUrl(message.instance);
      return [
        { type: "first open", instance: { baseUrl: instanceBaseUrl } },
        command.none,
      ];

    case "create app":
      // Create application on instance
      const createAppCommand = command.ofPromise.perform(
        () => api.createApp(model.instance.baseUrl, redirectUri),
        undefined,
        (app): WelcomePageMessage => ({ type: "set app credentials", app })
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
        (): WelcomePageMessage => ({ type: "navigate to authorization page" })
      );

      return [
        {
          ...instanceWithCredentials,
          type: "running code exchange",
        },
        persistCredentialsCommand,
      ];

    case "navigate to authorization page":
      if (!("app" in model)) {
        console.error("Invalid state, expected to have app");
        //TODO possible endless loop here
        return [
          { type: "first open", instance: model.instance },
          // Go back to step before
          command.ofMessage<WelcomePageMessage>({ type: "create app" }),
        ];
      }

      const authorizationUrl = createAuthorizationUrl(
        model.instance.baseUrl,
        model.app.client_id
      );

      // Could consider starting termination to gracefully shut down running processes but at this point there
      // shouldn't be any
      const navigateCommand = command.ofEffect<WelcomePageMessage>(() =>
        globalThis.location.assign(authorizationUrl)
      );
      return [model, navigateCommand];

    // This is the case when we loaded existing credentials
    case "verify credentials":
      const verifyCommand = command.ofPromise.perform(
        () =>
          api.verifyCredentials(model.instance.baseUrl, message.accessToken),
        undefined,
        (result): WelcomePageMessage => {
          if ("error" in result)
            return { type: "navigate to authorization page" };

          return { type: "navigate to home timeline" };
        }
      );

      return [model, verifyCommand];
    case "set access token":
      // Effect describes side effects which can be put into commands?
      const persistTokenCommand = command.ofFunction.perform(
        saveAccessToken,
        message.token,
        (): WelcomePageMessage => ({
          type: "navigate to home timeline",
        })
      );

      return [model, persistTokenCommand];
    case "navigate to home timeline":
      //TODO figure out how to send messages to parent like for navigation
      return [model, command.none];
  }
}

function createErrorUi(error?: AppError): TemplateResult | typeof nothing {
  //TODO implement proper error ui
  switch (error) {
    case "noCodeRedirect":
      return html`<section>
        No code was provided for authorization code flow. If you tried to sign
        in please go <a href="/">back</a> and try again
      </section>`;

    case "outdatedBrowser":
      return html`<section>
        Your browser might not be up to date or doesn't fully support this app.
        Some features might not work as expected.
      </section>`;

    // In case we have no error
    case undefined:
      return nothing;
  }
}
function view(
  model: WelcomePageModel,
  dispatch: Dispatch<WelcomePageMessage>
): TemplateResult {
  switch (model.type) {
    case "first open":
      const errorNotification = createErrorUi(model.error);
      // Using instance.hostname instead of host which would include the port (if specified)
      // The assumption is that instances run on https default port 443 all the time
      // This assumption should make selection of instance easier
      return html`<h1>Dim Ice Create App</h1>
        <form
          @submit=${(event: SubmitEvent) => {
            dispatch({ type: "create app" });
            event.preventDefault();
          }}
        >
          ${errorNotification}
          <input
            value="${model.instance.baseUrl.hostname}"
            id="instance"
            @change="${(event: Event) =>
              dispatch({
                type: "set instance",
                instance: (event.target as HTMLInputElement).value,
              })}"
          />
          <button type="submit">Authorize</button>
        </form>`;
    case "creating app":
      return html`Creating app...`;
    case "authorization required":
      return html`<h1>Dim Ice</h1>
        <form @submit=${dispatch({ type: "navigate to authorization page" })}>
          <input
            value="${model.instance.baseUrl.hostname}"
            id="instance"
            disabled
          />
          <button type="submit">Authorize</button>
        </form>`;
    case "running code exchange":
      return html`Exchaning code...`;
    case "verifying credentials":
      return html`Verifying credentials`;
  }
}

const welcomePage = {
  update,
  view,
};

export default welcomePage;
