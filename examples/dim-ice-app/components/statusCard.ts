import { TemplateResult, html, nothing, svg } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import Status from "../api/status";
import { accountAvatar } from "./avatar";
import ElmishElement from "../../../src/elmishComponent";
import { type Command, type Dispatch } from "../../../src/elmish/command";
import command from "../../../src/elmish/command";
import { css } from "../styling";

function getLanguage(status: Status) {
  if (status.content === "") return status.reblog?.language;

  return status.language;
}

type StatusCardMessage = {
  type: "set status";
  status: Status;
};

function retootIcon(): TemplateResult {
  return svg`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="retoot-icon">
    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
  `;
}
function retootIconSquare(): TemplateResult {
  return svg`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="retoot-icon">
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
</svg>

  `;
}

const formatter = new Intl.RelativeTimeFormat(undefined, {
  style: "narrow",
  numeric: "auto",
});
export class StatusCard extends ElmishElement<
  Status | null,
  StatusCardMessage
> {
  protected static styles?: Promise<CSSStyleSheet> = css`
    :host {
      --avatar-width: var(--size-10);
      --grid-gap: var(--size-2);
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --text-3: var(--gray-5);
      }
    }

    article {
      display: grid;
      grid-template-areas:
        "header header"
        "header header"
        "aside content"
        "aside footer";
      grid-template-columns: var(--avatar-width) 1fr;
      gap: var(--grid-gap);
      padding: var(--size-3);
      background-color: var(--surface-2);
      border-radius: var(--radius-3);
      border: var(--border-size-2) solid var(--surface-3);
      box-shadow: var(--shadow-1);
    }

    header {
      grid-area: header;
      display: grid;
      /* Need to imitate width of outer grid column with avatar since subgrid is not widely supported yet */
      grid-template-columns: var(--avatar-width) 1fr auto;
      column-gap: var(--grid-gap);
    }

    aside {
      grid-area: aside;
    }

    section {
      grid-area: 2 / content-start / content-end / content-end;
    }

    footer {
      /* grid-area: footer; */
      grid-column-start: 2;
    }

    /* The account avatar */
    picture {
      grid-column-start: 1;
    }

    img {
      width: var(--avatar-width);
      border-radius: var(--radius-round);
    }

    dim-ice-media-attachments-collection {
      grid-column-start: 2;
    }

    p {
      margin-block: 0;
    }

    svg {
      width: var(--size-4);
      justify-self: end;
      align-self: end;
      color: var(--text-3);
    }

    span.retooter {
      font-size: var(--font-size-1);
      line-height: var(--font-lineheight-0);
      align-self: end;
      color: var(--text-3);
    }

    span.tooter {
      font-size: var(--font-size-3);
      font-weight: var(--font-weight-4);
      color: var(--text-1);
      margin-bottom: var(--size-3);
      align-self: start;
    }

    time {
      color: var(--text-3);
    }

    div {
      background: wheat;
    }
  `;

  // Since Elmish Web Components are a weird mix of object oriented and functional design we need to hook this up
  // Setter based approach to state change through property
  set status(status: Status) {
    // Dispatch message that status changed
    this.dispatch({ type: "set status", status });
  }

  protected override update(
    message: StatusCardMessage,
    model: Status | null
  ): [Status | null, Command<StatusCardMessage>] {
    switch (message.type) {
      case "set status":
        return [message.status, command.none];
    }
  }

  initialize(): [Status | null, Command<StatusCardMessage>] {
    return [null, command.none];
  }

  static #getRelativeDate(date: Date) {
    // Naive approach to duration without temporal API
    const difference = date.getTime() - new Date().getTime();
    const seconds = difference / 1000;
    const minutes = seconds / 60;
    if (minutes > -1) {
      const rounded = Math.round(seconds);
      return formatter.format(rounded, "second");
    }

    const hours = minutes / 60;
    if (hours > -1) {
      return formatter.format(Math.round(minutes), "minute");
    }

    const days = hours / 24;
    // Is "yesterday" or "one day ago" before last midnight or between the last 24 and 48 hours?
    if (days > -1) {
      return formatter.format(Math.round(hours), "hour");
    }

    return formatter.format(Math.round(days), "day");
  }
  protected view(
    status: Status | null,
    dispatch: Dispatch<StatusCardMessage>
  ): TemplateResult {
    if (status === null) {
      return html`<section>No Status</section>`;
    }

    const isRetoot = status.content === "" && status.reblog !== null;
    const languageCode = getLanguage(status);
    const createdAt = isRetoot ? status.reblog!.created_at : status.created_at;
    const attachments = isRetoot
      ? status.reblog!.media_attachments
      : status.media_attachments;

    const createdAtDate = new Date(createdAt);
    const relativeDate = StatusCard.#getRelativeDate(createdAtDate);
    // We assume HTML provided by Mastodon is safe against XSS

    return html`
      <article lang="${languageCode ?? nothing}">
        <header>
          ${isRetoot
            ? html`${retootIconSquare()}
                <span class="retooter">${status.account.display_name}</span>`
            : nothing}
          ${accountAvatar(isRetoot ? status.reblog!.account : status.account)}

          <span class="tooter"
            >${isRetoot
              ? status.reblog!.account.display_name
              : status.account.display_name}</span
          >

          <time
            datetime="${createdAt}"
            title="${createdAtDate.toLocaleString()}"
            >${relativeDate}</time
          >
        </header>
        <section>
          ${unsafeHTML(isRetoot ? status.reblog?.content : status.content)}
        </section>
        ${attachments.length > 0
          ? html` <dim-ice-media-attachments-collection
              .attachments=${attachments}
            ></dim-ice-media-attachments-collection>`
          : nothing}

        <footer>Reactions</footer>
      </article>
    `;
  }
}
