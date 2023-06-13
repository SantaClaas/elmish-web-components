import { TemplateResult, html, nothing } from "lit-html";
import command, { Command, Dispatch } from "../../../src/elmish/command";
import Instance from "../instance";
import { UrlString } from "../api/models/string";
import { repeat } from "lit-html/directives/repeat.js";

// External message following good recommendations from https://medium.com/@MangelMaxime/my-tips-for-working-with-elmish-ab8d193d52fd
export type WelcomePageExternalMessage = {
  type: "instance submitted";
  instance: Instance;
};

export type WelcomePageMessage =
  | {
      readonly type: "set instance";
      readonly instance: string;
    }
  | {
      readonly type: "set server suggestions";
      readonly servers: MastodonServerInstance[];
    }
  | { type: "submit instance" };

export type WelcomePageModel = {
  instance: Instance;
  serverSuggestions: MastodonServerInstance[] | "loading";
};

function createInstanceBaseUrl(instance: string) {
  //TODO we should add some verification here because the string can be anything
  return new URL(`https://${instance}/`);
}
type MastodonServerInstance = {
  domain: UrlString;
  description: string;
  last_week_users: number;
};
async function getServerSuggestionList() {
  // This is not an officially supported API and I am not sure if I should use it
  const response = await fetch(
    `https://api.joinmastodon.org/servers?language=${navigator.language}&category=general&region=&ownership=&registrations=`
  );

  return (await response.json()) as MastodonServerInstance[];
}

/**
 * @param instance The default instance or the loaded instance
 */
function initialize(
  instance: Instance
): [WelcomePageModel, Command<WelcomePageMessage>] {
  // Load peers of mastodon.social as suggestion for what instance to pick

  const loadSuggestionsCommand = command.ofPromise.perform(
    getServerSuggestionList,
    undefined,
    (servers): WelcomePageMessage => ({
      type: "set server suggestions",
      servers,
    })
  );
  return [{ instance, serverSuggestions: "loading" }, loadSuggestionsCommand];
}

function update(
  message: WelcomePageMessage,
  model: WelcomePageModel
): [
  WelcomePageModel,
  Command<WelcomePageMessage>,
  WelcomePageExternalMessage?
] {
  switch (message.type) {
    case "set instance":
      const instanceBaseUrl = createInstanceBaseUrl(message.instance);

      // Get information about instance
      return [
        {
          serverSuggestions: model.serverSuggestions,
          instance: { baseUrl: instanceBaseUrl },
        },
        command.none,
      ];
    case "submit instance":
      return [
        model,
        command.none,
        { type: "instance submitted", instance: model.instance },
      ];
    case "set server suggestions":
      return [{ ...model, serverSuggestions: message.servers }, command.none];
  }
}

function view(
  model: WelcomePageModel,
  dispatch: Dispatch<WelcomePageMessage>
): TemplateResult {
  // Using instance.hostname instead of host which would include the port (if specified)
  // The assumption is that instances run on https default port 443 all the time
  // This assumption should make selection of instance easier
  return html` <form
    @submit=${(event: SubmitEvent) => {
      dispatch({ type: "submit instance" });
      event.preventDefault();
    }}
  >
    <article>
      <h1>Welcome</h1>
      <p>
        Dim Ice aims to help you catch up with your personal mastodon feed as
        quickly as possible by avoiding toots you have already seen and are not
        interesting to you anymore. We understand that you do not always have
        the time to check mastodon but don't want to miss out on the intersting
        thing people you follow post
      </p>
      <p>
        Before we begin you need to select the mastodon server you have an
        account with
      </p>
      <p>
        After that you will be redirected to your mastodon server to authorize
        this app to read your data. Your data will stay on your device and the
        mastodon server.
      </p>
    </article>
    <p>Please select your server</p>
    <input
      value="${model.instance.baseUrl.hostname}"
      id="instance"
      @change="${(event: Event) =>
        dispatch({
          type: "set instance",
          instance: (event.target as HTMLInputElement).value,
        })}"
    />
    <button type="submit">Submit</button>
    ${model.serverSuggestions !== "loading" &&
    model.serverSuggestions.length > 0
      ? html`<ul>
          ${repeat(
            model.serverSuggestions,
            (server) => html`<li class="suggestion">
              <h2>${server.domain}</h2>
              <p>${server.description}</p>
              <p>${server.last_week_users} active users last week</p>
            </li>`
          )}
        </ul>`
      : nothing}
  </form>`;
}

const welcomePage = {
  initialize,
  update,
  view,
};

export default welcomePage;
