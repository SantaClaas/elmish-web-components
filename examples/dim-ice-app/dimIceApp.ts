// The dim ice app mastodon client root component
import command from "../../src/elmish/command";
import { type Command, type Dispatch } from "../../src/elmish/command";
import { TemplateResult, html, nothing } from "lit-html";
import ElmishElement from "../../src/elmishComponent";
import Status from "./api/status";
import { StatusCard } from "./components/statusCard";
import { css } from "./styling";
import MediaAttachmentCollection from "./components/mediaAttachment";
import "@lit-labs/virtualizer";
import { LitVirtualizer } from "@lit-labs/virtualizer";
import type { RangeChangedEvent } from "@lit-labs/virtualizer/events";
import { UrlString } from "./api/string";

// I know you don't include them in source code normallyn
// Client credentials can be created on the fly
const clientSecret = "51Nwi4I83gxxgsqfPWZQLALHlIJgEjlIIh9o_Zdvh10";
const clientId = "NgtasltAXdbQgao8vU5H1pTLEBX1EGvuNThYYpUhoxA";

// Current location. Should not change while page is active
// Redirect url needs to be registered with app on mastodon.social
const redirectUri = new URL("/redirect", location.href);

// These types use tagged unions to emulate unions from F# or other more functional programming languages
type FirstOpen = {
  readonly type: "firstOpen";
  readonly authorizationUrl: URL;
  readonly error?: AppError;
};

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

/**
 * Represents the state when the app was openend after a redirect from the authorization code flow
 */
type RunningCodeExchange = {
  readonly type: "codeExchange";
};

/**
 * Represents the state when the app has an access token and is fetching the timeline
 */
type LoadingTimeline = {
  readonly type: "loadingTimeline";
  readonly token: AccessTokenResponse;
};

/**
 * Represents the app state when on the home timeline "page" and the latest stati were loaded
 */
type HomeTimeline = {
  readonly type: "homeTimeline";
  readonly stati: Status[];
  readonly links: PaginationUrls;
  readonly isLoadingMoreToots: boolean;
};

/**
 * Represents metadata about a mastodon server instance
 */
type Instance = {
  baseUrl: URL;
};

/**
 * Represents state that is always present in the app, like information about the selected instance
 */
type StaticAppData = {
  instance: Instance;
};

type Authorized = (LoadingTimeline | HomeTimeline) & {
  accessToken: AccessToken;
};

type Unauthorized = FirstOpen | RunningCodeExchange;
/**
 *  App model represents the different states the app can be in
 */
type AppModel = (Unauthorized | Authorized) & StaticAppData;

type AppMessage =
  | {
      readonly type: "setInstance";
      readonly instance: string;
    }
  | {
      readonly type: "setAccessToken";
      readonly token: AccessTokenResponse;
    }
  | {
      readonly type: "setStati";
      readonly homeTimeline: GetHomeTimelineResponse;
    }
  | {
      readonly type: "append toots";
      readonly toots: GetHomeTimelineResponse;
    }
  // This occurs when the range of stati rendered to the dom is changed by the lit virtualizer. If we reach the end of
  // the toots loaded, then we need to trigger loading more
  | {
      readonly type: "virtualizer range changed";
      readonly event: RangeChangedEvent;
    };
/**
 * A link that points to the next toots in the home timeline
 */
type NextUrl = UrlString;

/**
 * A link that points to the previous toots in the home timeline
 */
type PreviousUrl = UrlString;

type PaginationUrls = {
  next: NextUrl;
  previous: PreviousUrl;
};

type GetHomeTimelineResponse = {
  readonly toots: Status[];
  readonly links: PaginationUrls;
};

function createInstanceBaseUrl(instance: string) {
  //TODO we should add some verification here because the string can be anything
  return new URL(`https://${instance}/`);
}
function createAuthorizationUrl(instanceBaseUrl: URL) {
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

type AccessTokenRequest = {
  client_id: string;
  client_secret: string;
  redirect_uri: URL;
  grant_type: "authorization_code";
  code: string;
  scope: "read";
};

type AccessToken = string;
type Scope = string;
type UnixTimestampInSeconds = number;
type AccessTokenResponse = {
  access_token: AccessToken;
  token_type: "Bearer";
  scope: Scope;
  create_at: UnixTimestampInSeconds;
};

async function exchangeCodeForToken(
  instanceBaseUrl: URL,
  authorizationCode: string
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

/**
 * Parses the next and previous links from the Link header value
 * More details: https://docs.joinmastodon.org/api/guidelines/#pagination
 */
function parsePaginationLins(link: string): PaginationUrls {
  const [link1, link2] = link
    ?.split(", ")
    .map((linkSegment) =>
      linkSegment.split("; ").map((split) => {
        const trimmed = split.trim();
        // either <url> or rel="something"
        const dataStart = trimmed[0] === "<" ? 1 : 5;
        console.debug({ trimmed });
        return trimmed.substring(dataStart, trimmed.length - 1);
      })
    )
    .map(([link, relationship]) => ({
      link,
      relationship: relationship as "next" | "prev",
    }));

  // Assume "prev" and "next" exist always and only they exist
  if (link1.relationship === "prev") {
    return { next: link2.link, previous: link1.link };
  }

  return { next: link1.link, previous: link2.link };
}

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

const accessTokenStorageKey = "dim ice access token";
function tryLoadAccessToken(): AccessTokenResponse | undefined {
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
function saveAccessToken(token: AccessTokenResponse) {
  //TODO better differentiate errrors
  // We don't have persistent storage in incognito windows
  if (!("localStorage" in window)) return;

  const value = JSON.stringify(token);
  localStorage.setItem(accessTokenStorageKey, value);
}

class DimIceApp extends ElmishElement<AppModel, AppMessage> {
  initialize(): [AppModel, Command<AppMessage>] {
    // Default instance for now
    const defaultInstance = "mastodon.social";

    const instance: Instance = {
      baseUrl: createInstanceBaseUrl(defaultInstance),
    };

    const authorizationUrl = createAuthorizationUrl(instance.baseUrl);
    // Check if we are in authorization code flow
    // This takes precedence before trying to load an existing access token in case the user wants to authorize with
    // a different instance
    if (location.pathname === "/redirect") {
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
            authorizationUrl,
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
        ({ base, code }) => exchangeCodeForToken(base, code),
        { base: instance.baseUrl, code },
        (token: AccessTokenResponse): AppMessage => ({
          type: "setAccessToken",
          token,
        })
      );

      return [{ type: "codeExchange", instance }, exchangeCommand];
    }
    // Try to load existing access token
    const token = tryLoadAccessToken();
    if (token === undefined)
      return [
        {
          type: "firstOpen",
          authorizationUrl,
          instance,
        },
        command.none,
      ];

    //TODO should I set the token with the command to not duplicate code in update method or should it be duplicate
    // and set directly to loading timeline. I could just write a function to not duplicate.
    // const setCommand = command.ofMessage<AppMessage>({
    //   type: "setAccessToken",
    //   token,
    // });
    const fetchTimelineCommand = command.ofPromise.perform(
      () => getHomeTimeline(instance.baseUrl, token.access_token),
      undefined,
      (stati): AppMessage => ({ type: "setStati", homeTimeline: stati })
    );
    return [
      {
        type: "loadingTimeline",
        token: token,
        instance: instance,
        accessToken: token.access_token,
      },
      fetchTimelineCommand,
    ];
  }

  update(
    message: AppMessage,
    model: AppModel
  ): [AppModel, Command<AppMessage>] {
    //TODO split up in landing page and home page
    switch (message.type) {
      case "setInstance":
        const instanceBaseUrl = createInstanceBaseUrl(message.instance);
        const authorizationUrl = createAuthorizationUrl(instanceBaseUrl);
        // Yes this allocates a new object but I prefer immutability.
        // Might consider changing when measurable disadvantage exists
        return [
          {
            type: "firstOpen",
            authorizationUrl,
            instance: model.instance,
          },
          command.none,
        ];

      case "setAccessToken":
        //TODO error handling
        const fetchTimelineCommand = command.ofPromise.perform(
          () =>
            getHomeTimeline(model.instance.baseUrl, message.token.access_token),
          undefined,
          (stati): AppMessage => ({ type: "setStati", homeTimeline: stati })
        );

        // Effect describes side effects which can be put into commands?
        const persistTokenCommand = command.ofEffect<AppMessage>(() =>
          saveAccessToken(message.token)
        );

        const commands = command.batch([
          fetchTimelineCommand,
          persistTokenCommand,
        ]);

        return [
          {
            type: "loadingTimeline",
            token: message.token,
            instance: model.instance,
            accessToken: message.token.access_token,
          },
          commands,
        ];
      case "setStati":
        //TODO this should change when we swap to home page with its own model
        if (model.type !== "loadingTimeline") {
          console.error("Can't set toots if wasn't loading them before");
          return [model, command.none];
        }

        return [
          {
            type: "homeTimeline",
            stati: message.homeTimeline.toots,
            links: message.homeTimeline.links,
            instance: model.instance,
            isLoadingMoreToots: false,
            accessToken: model.accessToken,
          },
          command.none,
        ];

      case "virtualizer range changed":
        console.debug("Virtualizer range changed", {
          last: message.event.last,
          first: message.event.first,
        });
        if (model.type !== "homeTimeline") {
          //TODO separate into home time line page component to avoid this invalid state
          console.error("Separate state, claas");
          return [model, command.none];
        }

        if (model.isLoadingMoreToots) {
          // Already loading more toots don't need to start another one
          console.debug("The lock 🔒 worked 🙂");
          return [model, command.none];
        }

        if (message.event.last !== model.stati.length - 1) {
          console.debug("The last toot has not been seen! ✋");
          return [model, command.none];
        }

        console.debug("Last toot rendered! ⌚️");
        console.debug("Getting nex toots from ", model.links.next);
        //TODO error handling
        const fetchNextTootsCommand = command.ofPromise.perform(
          () => fetchTootsFromUrl(model.links.next, model.accessToken),
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
            stati: [...model.stati, ...message.toots.toots],
          },
          command.none,
        ];
    }
  }

  static styles = css`
    /* Additional normalization */
    ul {
      padding-inline-start: 0;
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

      case "firstOpen":
        const errorNotification = createErrorUi(model.error);
        // Using instance.hostname instead of host which would include the port (if specified)
        // The assumption is that instances run on https default port 443 all the time
        // This assumption should make selection of instance easier
        return html`<h1>Dim Ice</h1>
          ${errorNotification}
          <input
            value="${model.instance.baseUrl.hostname}"
            id="instance"
            @change="${(event: Event) =>
              dispatch({
                type: "setInstance",
                instance: (event.target as HTMLInputElement).value,
              })}"
          />
          <a href="${model.authorizationUrl.href}">Authorize</a>`;

      case "loadingTimeline":
        return html`<section>Loading toots...</section>`;

      case "homeTimeline":
        return html` <h1>Home Timeline</h1>
          <ul>
            <lit-virtualizer
              @rangeChanged=${(event: RangeChangedEvent) =>
                dispatch({ type: "virtualizer range changed", event })}
              .items=${model.stati}
              .renderItem=${(status: Status) =>
                html`<dim-ice-status-card
                  .status=${status}
                ></dim-ice-status-card>`}
            >
            </lit-virtualizer>
          </ul>`;
    }
  }
}

customElements.define(
  "dim-ice-media-attachments-collection",
  MediaAttachmentCollection
);
customElements.define("dim-ice-status-card", StatusCard);
customElements.define("dim-ice-app", DimIceApp);
