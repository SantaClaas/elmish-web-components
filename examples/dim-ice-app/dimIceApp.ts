// The dim ice app mastodon client root component
import { Command, Dispatch } from "../../src/elmish/command";

import { TemplateResult, html, render } from "lit-html";
import ElmishComponent from "./elmishComponent";

// I know you don't include them in source code normally
const clientSecret = "51Nwi4I83gxxgsqfPWZQLALHlIJgEjlIIh9o_Zdvh10";
const clientId = "NgtasltAXdbQgao8vU5H1pTLEBX1EGvuNThYYpUhoxA";

// Current location. Should not change while page is active
const redirectUri = new URL("/redirect", location.href);

type AppModel = {
  readonly instance: string;
  readonly authorizationUrl: URL;
};

type AppMessage =
  // Using tagged unions
  {
    type: "setInstance";
    instance: string;
  };

function createAuthorizationUrl(instance: string) {
  const base = new URL(`https://${instance}/`);
  const authorizationUrl = new URL("/oauth/authorize", base);
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("scope", "read");
  // authorizationUrl.searchParams.set("redirect_uri", "urn:ietf:wg:oauth:2.0:oob");
  //TODO make redirect url current app url
  authorizationUrl.searchParams.set("redirect_uri", redirectUri.toString());
  authorizationUrl.searchParams.set("response_type", "code");

  return authorizationUrl;
}

class DimIceApp extends ElmishComponent<AppModel, AppMessage> {
  initialize(): [AppModel, Command<AppMessage>] {
    const instance = "mastodon.social";
    const authorizationUrl = createAuthorizationUrl(instance);
    return [{ instance, authorizationUrl }, []];
  }

  update(
    message: AppMessage,
    model: AppModel
  ): [AppModel, Command<AppMessage>] {
    switch (message.type) {
      case "setInstance":
        const authorizationUrl = createAuthorizationUrl(message.instance);
        return [{ authorizationUrl, instance: message.instance }, []];
    }
  }

  view(model: AppModel, dispatch: Dispatch<AppMessage>): TemplateResult {
    return html`<h1>Dim Ice</h1>
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

customElements.define("dim-ice-app", DimIceApp);
