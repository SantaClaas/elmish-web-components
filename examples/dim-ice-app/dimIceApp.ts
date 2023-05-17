// The dim ice app mastodon client root component
import command from "../../src/elmish/command";
import { type Command, type Dispatch } from "../../src/elmish/command";
import { TemplateResult, html, nothing } from "lit-html";
import ElmishElement from "../../src/elmishComponent";
import Status from "./api/models/status";
import { StatusCard } from "./components/statusCard";
import { css } from "./styling";
import MediaAttachmentCollection from "./components/mediaAttachment";
import "@lit-labs/virtualizer";
import { AccessToken } from "./api/models/string";
import Application from "./api/models/apps/application";
import AccessTokenResponse from "./api/models/oauth/accessTokenResponse";
import {
  tryLoadAppCredentials,
  tryLoadAccessToken,
  saveAppCredentials,
  saveAccessToken,
} from "./localStorage";
import GetHomeTimelineResponse from "./api/models/getHomeTimelineResponse";
import PaginationUrls from "./api/paginationUrls";
import api from "./api/api";
import homeTimelinePage, {
  HomeTimelinePageMessage,
  HomeTimelinePageModel,
} from "./pages/homeTimelinePage";
import { WelcomePageMessage, WelcomePageModel } from "./pages/welcomePage";
import Instance from "./instance";

/**
 * Represents the state when the app has an access token and is fetching the timeline
 */
type LoadingTimeline = {
  readonly type: "loadingTimeline";
};

/**
 * Represents the app state when on the home timeline "page" and the latest stati were loaded
 */
type HomeTimeline = {
  readonly type: "homeTimeline";
  readonly toots: Status[];
  readonly links: PaginationUrls;
  readonly isLoadingMoreToots: boolean;
};

type Page =
  | {
      page: "home timeline";
      model: HomeTimelinePageModel;
    }
  | { page: "welcome"; model: WelcomePageModel };
/**
 *  App model represents the different states the app can be in
 */
// type AppModel = (Unauthorized | Authorized) &
//   StaticAppData & {
//     page: "home timeline";
//     pageModel: HomeTimelinePageModel;
//   };
type AppModel = {
  currentPage: Page;
  instance: Instance;
};
export type AppMessage =
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
      readonly type: "setAccessToken";
      readonly token: AccessTokenResponse;
    }
  | {
      readonly type: "load home timeline";
      readonly token: AccessToken;
    }
  | {
      readonly type: "set toots";
      readonly homeTimeline: GetHomeTimelineResponse;
    }
  | {
      readonly type: "append toots";
      readonly toots: GetHomeTimelineResponse;
    }

  // New messages
  | {
      readonly type: "navigate to home timeline";
    }
  | {
      readonly type: "welcome page message";
      readonly message: WelcomePageMessage;
    }
  | {
      readonly type: "home timeline page message";
      readonly message: HomeTimelinePageMessage;
    };

function startCodeExchange(
  instance: Instance,
  app: Application
): [AppModel, Command<AppMessage>] {
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
        type: "firstOpen",
        error: "noCodeRedirect",
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
    (token: AccessTokenResponse): AppMessage => ({
      type: "setAccessToken",
      token,
    })
  );

  return [{ type: "codeExchange", instance, app }, exchangeCommand];
}

class DimIceApp extends ElmishElement<AppModel, AppMessage> {
  initialize(): [AppModel, Command<AppMessage>] {
    // Default instance for now
    const defaultInstance = "mastodon.social";

    const instance: Instance = {
      baseUrl: createInstanceBaseUrl(defaultInstance),
    };

    // Try load app credentials, if we don't have app credentials we need to start onboarding again
    const app = tryLoadAppCredentials();
    if (app === undefined)
      return [
        {
          type: "firstOpen",
          instance,
        },
        command.none,
      ];

    // Check if we are in authorization code flow
    // This takes precedence before trying to load an existing access token in case the user wants to authorize with
    // a different instance
    if (location.pathname === "/redirect")
      return startCodeExchange(instance, app);

    // Try to load existing access token
    const token = tryLoadAccessToken();
    if (token === undefined)
      return [
        {
          type: "authorization required",
          app,
          instance,
        },
        command.none,
      ];

    const verifyCredentialsCommand = command.ofMessage<AppMessage>({
      type: "verify credentials",
      accessToken: token.access_token,
    });

    return [
      { type: "verifying credentials", instance, app },
      verifyCredentialsCommand,
      // command.none,
    ];
  }

  update(
    message: AppMessage,
    model: AppModel
  ): [AppModel, Command<AppMessage>] {
    //TODO split up in landing page and home page
    switch (message.type) {
      case "set instance":
        const instanceBaseUrl = createInstanceBaseUrl(message.instance);

        // Yes this allocates a new object but I prefer immutability.
        // Might consider changing when measurable disadvantage exists
        return [
          {
            type: "firstOpen",
            instance: { baseUrl: instanceBaseUrl },
          },
          command.none,
        ];
      case "create app":
        // Create application on instance
        const createAppCommand = command.ofPromise.perform(
          () => api.createApp(model.instance.baseUrl, redirectUri),
          undefined,
          (app): AppMessage => ({ type: "set app credentials", app })
        );
        return [
          { type: "creating app", instance: model.instance },
          createAppCommand,
        ];

      // App credentials are set once during the onboarding flow
      case "set app credentials":
        // Save to local storage
        const persistCredentialsCommand = command.ofFunction.perform(
          saveAppCredentials,
          message.app,
          (): AppMessage => ({ type: "navigate to authorization page" })
        );
        console.debug({ model });
        return [
          { type: "codeExchange", app: message.app, instance: model.instance },
          persistCredentialsCommand,
        ];

      // We can get here after an app has been created or an app already exists but reauthorization is required
      case "navigate to authorization page":
        if (!("app" in model)) {
          console.error("Invalid state, expected to have app");
          return [
            { type: "firstOpen", instance: model.instance },
            command.none,
          ];
        }
        const authorizationUrl = createAuthorizationUrl(
          model.instance.baseUrl,
          model.app.client_id
        );

        console.debug("Navigating to authorization page", authorizationUrl);

        // Could consider starting termination to gracefully shut down running processes but at this point there
        // shouldn't be any
        const navigateCommand = command.ofEffect<AppMessage>(() =>
          globalThis.location.assign(authorizationUrl)
        );
        return [model, navigateCommand];

      case "verify credentials":
        if (!("app" in model)) {
          console.error("Invalid state, expected to have app");
          return [
            { type: "firstOpen", instance: model.instance },
            command.none,
          ];
        }

        const verifyCommand = command.ofPromise.perform(
          () =>
            api.verifyCredentials(model.instance.baseUrl, message.accessToken),
          undefined,
          (result): AppMessage => {
            if ("error" in result)
              return { type: "navigate to authorization page" };

            return { type: "load home timeline", token: message.accessToken };
          }
        );

        return [
          {
            type: "verifying credentials",
            app: model.app,
            instance: model.instance,
          },
          verifyCommand,
        ];

      // Exchange credentials for access token
      case "setAccessToken":
        // Effect describes side effects which can be put into commands?
        const persistTokenCommand = command.ofFunction.perform(
          saveAccessToken,
          message.token,
          (): AppMessage => ({
            type: "load home timeline",
            token: message.token.access_token,
          })
        );

        return [model, persistTokenCommand];
      case "sign out":
        if (model.type !== "homeTimeline") {
          console.error("Can not sign out if not on home time line");
          return [model, command.none];
        }

        const revokeTokenCommand = command.ofEffect<AppMessage>(() =>
          api.revokeToken(
            model.instance.baseUrl,
            model.accessToken,
            model.app.client_id,
            model.app.client_secret
          )
        );

        return [
          { type: "firstOpen", instance: model.instance },
          revokeTokenCommand,
        ];

      case "load home timeline":
        if (!("app" in model)) {
          console.error("Expected to have app at this point", { model });
          return [model, command.none];
        }

        //TODO error handling
        const fetchTimelineCommand = command.ofPromise.perform(
          () => api.getHomeTimeline(model.instance.baseUrl, message.token),
          undefined,
          (stati): AppMessage => ({ type: "set toots", homeTimeline: stati })
        );
        return [
          {
            type: "loadingTimeline",
            accessToken: message.token,
            app: model.app,
            instance: model.instance,
          },
          fetchTimelineCommand,
        ];

      case "set toots":
        //TODO this should change when we swap to home page with its own model
        if (model.type !== "loadingTimeline") {
          console.error("Can't set toots if wasn't loading them before");
          return [model, command.none];
        }

        return [
          {
            type: "homeTimeline",
            toots: message.homeTimeline.toots,
            links: message.homeTimeline.links,
            instance: model.instance,
            isLoadingMoreToots: false,
            accessToken: model.accessToken,
            app: model.app,
          },
          command.none,
        ];
      case "home timeline page message":
        if (model.type != "homeTimeline") {
          console.error("Excpected home time line model");
          return [model, command.none];
        }
        const newModel = homeTimelinePage.update(message.message, model);
        return [model, command.none];
      case "virtualizer range changed":
        if (model.type !== "homeTimeline") {
          //TODO separate into home time line page component to avoid this invalid state
          console.error("Separate state, claas");
          return [model, command.none];
        }

        if (model.isLoadingMoreToots) {
          // Already loading more toots don't need to start another one
          return [model, command.none];
        }

        if (message.event.last !== model.toots.length - 1) {
          return [model, command.none];
        }

        //TODO error handling
        const fetchNextTootsCommand = command.ofPromise.perform(
          () => api.fetchTootsFromUrl(model.links.next, model.accessToken),
          undefined,
          (toots): AppMessage => ({ type: "append toots", toots })
        );

        return [{ ...model, isLoadingMoreToots: true }, fetchNextTootsCommand];
      case "append toots":
        if (model.type !== "homeTimeline") {
          //TODO separate into home time line page component to avoid this invalid state
          console.error("Separate state again, claas");
          return [model, command.none];
        }

        return [
          {
            ...model,
            isLoadingMoreToots: false,
            links: message.toots.links,
            // I tried push but lit virtualizer does not seem to update if it is the same array
            toots: [...model.toots, ...message.toots.toots],
          },
          command.none,
        ];
    }
  }

  static styles = css`
    /* Additional normalization */
    ul {
      padding-inline-start: 0;
      max-width: var(--size-15);
      margin-inline: auto;
    }

    ul lit-virtualizer > * + * {
      border-top: var(--border-size-2) solid var(--surface-2);
    }

    /* Start of styling */

    :host {
      /* Default display does not seem to be block and causes content to overflow and display normally.
         But padding and other styles only apply to a small rectangle
       */
      display: block;
    }

    h1 {
      padding-inline-start: var(--size-2);
    }
  `;

  view(model: AppModel, dispatch: Dispatch<AppMessage>): TemplateResult {
    // Thanks to union support in TypeScript the compiler can detect that these are the only valid cases and that we don't need to handle default
    switch (model.type) {
      case "codeExchange":
        //TODO improve this short lived UI to be more user friendly and less technical terms
        return html`<section>Exchaning token...</section>`;

      case "creating app":
        return html`Creating App...`;
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
      case "firstOpen":
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

      case "verifying credentials":
        return html`Verifying credentials`;
      case "loadingTimeline":
        return html`<section>Loading toots...</section>`;
      case "homeTimeline":
        return html`<main>
          ${homeTimelinePage.view(model, (message) =>
            dispatch({ type: "home timeline page message", message })
          )}
        </main>`;
    }
  }
}

customElements.define(
  "dim-ice-media-attachments-collection",
  MediaAttachmentCollection
);
customElements.define("dim-ice-status-card", StatusCard);
customElements.define("dim-ice-app", DimIceApp);
