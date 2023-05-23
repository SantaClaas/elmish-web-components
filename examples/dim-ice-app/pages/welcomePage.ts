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
  return html`<h1>Dim Ice Create App</h1>
    <form
      @submit=${(event: SubmitEvent) => {
        dispatch({ type: "submit instance" });
        event.preventDefault();
      }}
    >
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
}

const welcomePage = {
  initialize,
  update,
  view,
};

export default welcomePage;
