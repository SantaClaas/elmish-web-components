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
  return svg`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
  `;
}
function retootIconSquare(): TemplateResult {
  return svg`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
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
      --avatar-width: var(--size-8);
      --grid-gap: var(--size-2);
      /* --grid-gap: 0; */
      --half-avatar-width: calc(var(--avatar-width) / 2);
      display: block;
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
      grid-template-rows: auto var(--half-avatar-width) 1fr auto;
      gap: 0 var(--grid-gap);
      padding: var(--size-2);
      overflow: hidden;
    }

    article:has(span.retooter) {
      grid-template-rows: auto var(--half-avatar-width) 1fr auto;
    }

    header {
      grid-row-start: 1;
      grid-row-end: 2;
      grid-column-start: span 2;
      display: grid;
      /* Need to imitate width of outer grid column with avatar since subgrid is not widely supported yet */
      grid-template-columns: var(--avatar-width) 1fr auto;
      grid-template-rows: auto;
      column-gap: var(--grid-gap);
    }

    header:has(span.retooter) {
      grid-area: header;
      grid-template-rows: var(--half-avatar-width);
    }

    header:has(span.retooter) {
      grid-template-rows: auto var(--half-avatar-width);
    }

    article:has(span.retooter) header {
      grid-template-rows: auto var(--half-avatar-width) var(--half-avatar-width);
    }

    aside {
      grid-area: aside;
    }

    section {
      grid-area: 2 / content-start / content-end / content-end;
    }

    /* Fix links in toots overflowing */
    section p a {
      overflow-wrap: anywhere;
    }

    footer {
      grid-column-start: 2;
      display: flex;
      justify-content: space-between;
      margin-block-start: var(--size-3);
    }
    footer button {
      background-color: transparent;
      border: none;
    }
    footer button svg {
      width: var(--size-5);
      color: var(--text-3);
    }

    /* The account avatar */
    picture {
      grid-column-start: 1;
      /* Remove the height so that img overflows and container height is determined by tooter name text height */
      height: 0;
    }

    span.retooter + picture {
      grid-row-start: 2;
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

    header svg {
      width: var(--size-3);
      justify-self: end;
      align-self: end;
      color: var(--text-3);
      grid-column-start: 1;
      grid-row-start: 1;
    }

    span.retooter {
      font-size: var(--font-size-1);
      line-height: var(--font-lineheight-0);
      align-self: end;
      color: var(--text-3);
      grid-column-start: 2;
      grid-row-start: 1;
    }

    span.tooter {
      font-size: var(--font-size-3);
      font-weight: var(--font-weight-4);
      color: var(--text-1);
      /* margin-bottom: var(--size-3); */
      align-self: start;
      grid-column-start: 2;
      line-height: var(--font-lineheight-0);
      min-height: 0;
    }

    span.retooter + span.tooter {
      grid-row-start: 2;
    }

    time {
      color: var(--text-3);
      grid-column-start: 3;
      line-height: var(--font-lineheight-0);
      align-self: start;
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
    // Substracting the larger date from the smaller date since we need a negative number for formatting
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
          <!-- <div>Content</div> -->
        </header>
        <section>
          ${unsafeHTML(isRetoot ? status.reblog?.content : status.content)}
        </section>
        ${attachments.length > 0
          ? html` <dim-ice-media-attachments-collection
              .attachments=${attachments}
            ></dim-ice-media-attachments-collection>`
          : nothing}

        <footer>
          <button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
              />
            </svg>
          </button>
          <button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
              />
            </svg>
          </button>
          <button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
          <button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </button>
        </footer>
      </article>
    `;
  }
}
