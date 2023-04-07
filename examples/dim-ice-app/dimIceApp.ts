// The dim ice app mastodon client root component
import { Command, Dispatch } from "../../src/elmish/command";

import { TemplateResult, html, nothing } from "lit-html";
import ElmishComponent from "./elmishComponent";

// I know you don't include them in source code normally
const clientSecret = "51Nwi4I83gxxgsqfPWZQLALHlIJgEjlIIh9o_Zdvh10";
const clientId = "NgtasltAXdbQgao8vU5H1pTLEBX1EGvuNThYYpUhoxA";

// Current location. Should not change while page is active
// Redirect url needs to be registered with app on mastodon.social
const redirectUri = new URL("/redirect", location.href);

// These types use tagged unions to emulate unions from F# or other more functional programming languages
type FirstOpen = {
  readonly type: "firstOpen";
  readonly instance: string;
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
type RunningCodeExchangeState = {
  readonly type: "codeExchange";
};

/**
 *  App model represents the different states the app can be in
 */
type AppModel = FirstOpen | RunningCodeExchangeState;

type AppMessage = {
  type: "setInstance";
  instance: string;
};

function createAuthorizationUrl(instance: string) {
  // Probably should do validation that instance is an url string like "mastodon.social"
  const base = new URL(`https://${instance}/`);
  const authorizationUrl = new URL("/oauth/authorize", base);
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

class DimIceApp extends ElmishComponent<AppModel, AppMessage> {
  initialize(): [AppModel, Command<AppMessage>] {
    const instance = "mastodon.social";
    const authorizationUrl = createAuthorizationUrl(instance);
    // Check if we are in authorization code flow
    if (location.pathname === "/redirect") {
      // Get code from url
      const currentLocation = new URL(location.href);
      const code = currentLocation.searchParams.get("code");
      // Remove code from url so we don't trigger another exchange accidentally
      currentLocation.searchParams.delete("code");
      // Reset path
      currentLocation.pathname = "";

      if (code === null) {
        // This is an error. We got navigated to redirect but did not get a code passed as query parameter
        // Though this is an expectable error as users can just open the app with "/redirect" and not pass an error.
        // There are many other reasons we can end up in this state
        // How should we deal with this? Set state to first open state with error message or just log it to console?

        return [
          {
            type: "firstOpen",
            authorizationUrl,
            instance,
            error: "noCodeRedirect",
          },
          [],
        ];
      }

      // Start async code exchange command (side effect)

      return [{ type: "codeExchange" }, []];
    }

    return [{ type: "firstOpen", instance, authorizationUrl }, []];
  }

  update(
    message: AppMessage,
    model: AppModel
  ): [AppModel, Command<AppMessage>] {
    switch (message.type) {
      case "setInstance":
        const authorizationUrl = createAuthorizationUrl(message.instance);
        // Yes this allocates a new object but I prefer immutability
        return [
          {
            ...model,
            type: "firstOpen",
            authorizationUrl,
            instance: message.instance,
          },
          [],
        ];
    }
  }

  static #createErrorUi(error?: AppError): TemplateResult | typeof nothing {
    //TODO implement proper error ui
    switch (error) {
      case "noCodeRedirect":
        return html`<p>
          No code was provided for authorization code flow. If you tried to sign
          in please go <a href="/">back</a> and try again
        </p>`;

      case "outdatedBrowser":
        return html`<p>
          Your browser might not be up to date or doesn't fully support this
          app. Some features might not work as expected.
        </p>`;

      case undefined:
        return nothing;
    }
  }

  view(model: AppModel, dispatch: Dispatch<AppMessage>): TemplateResult {
    // Thanks to union support in TypeScript the compiler can detect that these are the only valid cases and that we don't need to handle default
    switch (model.type) {
      case "codeExchange":
        //TODO improve this short lived UI to be more user friendly and less technical terms
        return html`<p>Exchaning token...</p>`;
      case "firstOpen":
        const errorNotification = DimIceApp.#createErrorUi(model.error);
        return html`<h1>Dim Ice</h1>
          ${errorNotification}
          <input
            value="${model.instance}"
            id="instance"
            @change="${(event: Event) =>
              dispatch({
                type: "setInstance",
                instance: (event.target as HTMLInputElement).value,
              })}"
          />
          <a href="${model.authorizationUrl.href}">Authorize</a>`;
    }
  }
}

customElements.define("dim-ice-app", DimIceApp);
