import { TemplateResult, html, nothing } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import Status from "../api/status";
import { accountAvatar } from "./avatar";
import { mediaAttachments } from "./mediaAttachment";
import ProgramComponent from "../../../src/elmishComponent";
import { type Command, type Dispatch } from "../../../src/elmish/command";
import command from "../../../src/elmish/command";

function getLanguage(status: Status) {
  if (status.content === "") return status.reblog?.language;

  return status.language;
}
/**
 * Renders a status card
 */
export function statusCard(status: Status): TemplateResult {
  const isRetoot = status.content === "" && status.reblog !== null;
  const languageCode = getLanguage(status);

  // We assume HTML provided by Mastodon is safe against XSS
  return html` <article lang="${languageCode ?? nothing}">
    ${accountAvatar(status.account)}
    <span>${status.account.display_name}</span>
    <time datetime="${status.created_at}"
      >${new Date(status.created_at).toLocaleString()}</time
    >
    <p>Is Retoot: ${isRetoot ? "yes" : "no"}</p>

    ${isRetoot
      ? html` <p>Retotee:</p>
          ${accountAvatar(status.reblog!.account)}
          <span>${status.reblog?.account.display_name}</span>
          <time datetime="${status.reblog?.created_at}"
            >${new Date(status.reblog!.created_at).toLocaleString()}</time
          >`
      : nothing}
    <p>${unsafeHTML(isRetoot ? status.reblog?.content : status.content)}</p>

    ${mediaAttachments(status.media_attachments)}
  </article>`;
}

class StatusCard extends ProgramComponent<Status | null, undefined> {
  initialize(): [Status | null, Command<undefined>] {
    return [null, command.none];
  }
  protected view(model: Status, dispatch: Dispatch<undefined>): TemplateResult {
    throw new Error("Method not implemented.");
  }
}
