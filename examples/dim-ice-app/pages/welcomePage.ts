import { TemplateResult, html } from "lit-html";
import command, { Command, Dispatch } from "../../../src/elmish/command";
import Instance from "../instance";

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
  | { type: "submit instance" };

export type WelcomePageModel = { instance: Instance };

function createInstanceBaseUrl(instance: string) {
  //TODO we should add some verification here because the string can be anything
  return new URL(`https://${instance}/`);
}
/**
 * @param instance The default instance or the loaded instance
 */
function initialize(
  instance: Instance
): [WelcomePageModel, Command<WelcomePageMessage>] {
  return [{ instance }, command.none];
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
      return [{ instance: { baseUrl: instanceBaseUrl } }, command.none];
    case "submit instance":
      return [
        model,
        command.none,
        { type: "instance submitted", instance: model.instance },
      ];
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
  </form>`;
}

const welcomePage = {
  initialize,
  update,
  view,
};

export default welcomePage;
