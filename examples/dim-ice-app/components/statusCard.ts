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

export class StatusCard extends ElmishElement<
  Status | null,
  StatusCardMessage
> {
  // protected static styles?: Promise<CSSStyleSheet> = css`
  //   article {
  //     border-radius: var(--radius-3);
  //     border: var(--border-size-2) solid var(--surface-3);
  //     box-shadow: var(--shadow-1);
  //     overflow: hidden;
  //     padding: var(--size-3);
  //     background: var(--surface-2);
  //     display: grid;
  //     grid-template-columns: auto 1fr;
  //     /* grid-template-rows: repeat(3, auto); */
  //     gap: var(--size-3);
  //   }

  //   /* The account avatar */
  //   img {
  //     width: var(--size-10);
  //     border-radius: var(--radius-round);
  //   }

  //   picture {
  //     grid-row-start: span 2;
  //     grid-column-start: 1;
  //   }

  //   section.content {
  //     grid-column-start: 2;
  //   }

  //   /* Reset paragraph default styling for user provided content */
  //   p {
  //     margin-block: 0;
  //   }

  //   header {
  //     grid-col-start: span 2;
  //   }

  //   dim-ice-media-attachments-collection {
  //     grid-column-start: 2;
  //     grid-row-start: 3;
  //   }

  //   svg.retoot-icon {
  //     width: var(--size-4);
  //     justify-self: end;
  //     align-self: end;
  //   }
  // `;

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

    // We assume HTML provided by Mastodon is safe against XSS
    // return html` <article lang="${languageCode ?? nothing}">
    //   <!-- <div>${accountAvatar(status.account)}</div> -->

    //   ${isRetoot
    //     ? html`${retootIconSquare()}<span>${status.account.display_name}</span>`
    //     : nothing}
    //   ${accountAvatar(isRetoot ? status.reblog!.account : status.account)}
    //   <header>
    //     <span
    //       >${(isRetoot ? status.reblog!.account : status.account)
    //         .display_name}</span
    //     >
    //     <time datetime="${status.created_at}"
    //       >${new Date(status.created_at).toLocaleString()}</time
    //     >
    //     <!-- ${isRetoot
    //       ? html` <span>${status.reblog?.account.display_name}</span>
    //           <time datetime="${status.reblog?.created_at}"
    //             >${new Date(status.reblog!.created_at).toLocaleString()}</time
    //           >`
    //       : nothing} -->
    //   </header>
    //   <!-- <section>Is Retoot: ${isRetoot ? "yes" : "no"}</section> -->

    //   <section class="content">
    //     ${unsafeHTML(isRetoot ? status.reblog?.content : status.content)}
    //   </section>

    //   ${status.media_attachments.length > 0
    //     ? html` <dim-ice-media-attachments-collection
    //         .attachments=${status.media_attachments}
    //       ></dim-ice-media-attachments-collection>`
    //     : nothing}
    // </article>

    // `;

    const oldCss = css`
      article:has(span.retoot-icon) {
        background: white;
        grid-template-areas:
          "header header header"
          "aside content content"
          "aside footer footer";
      }

      header {
        /* The immitating of the outer grid with the image inside would not be necessary if subgrid was supported */
        grid-template-columns: var(--avatar-width) 1fr 1fr;
        grid-template-areas:
          "retoot-icon reooter retooter"
          "overlap tooter date";
      }

      span.tooter {
        /* grid-area: tooter-start / tooter-start; */
        grid-column-start: 2;
      }

      span.retooter {
        grid-area: retooter-start / retooter-start / retooter-end / retooter-end;
      }

      time {
        grid-column-start: 3;
      }
    `;

    return html`
      <style>
        :host {
          --avatar-width: var(--size-10);
        }

        @supports not (grid-template: subgrid / subgrid) {
          /* Change rows if we don't need a retoot row only when subgrid is not supported */
          article {
            display: grid;
            grid-template-columns: auto 1fr 1fr;
            grid-template-rows: repeat(3, auto);
            background: green;
          }

          /* Extend rows count to enable header to have 2 rows */
          article:has(header > span.retoot-icon) {
            color: black;
            grid-template-rows: repeat(4, auto);
            /* gap: 1rem; */
          }

          header {
            grid-column-start: 2;
            grid-column-end: 4;

            display: grid;
            grid-template-columns: 1fr 1fr;
            /* gap: 1rem; */

            background: purple;
          }

          /* We shift the header to show the retoot icon above the avatar in case it is a retoot */
          header:has(span.retoot-icon) {
            /* In that case we need to immitate the outer grid */
            grid-template-columns: var(--avatar-width) 1fr 1fr;
            background: yellow;
            grid-column-start: 1;
            /* We span the header so that we can overlap the aside with the avatar half way */
            grid-area: 1 / 1 / 3 / 4;
          }

          aside {
            background: orange;
            grid-area: 1 / 1 / 3 / 1;
          }
          /* If aside has a sibling header which has a retoot icon (meaning the toot is a retoot),
             then start at the second row */
          header:has(span.retoot-icon) + aside {
            background: hotpink;
            grid-area: 2 / 1 / 5 / 1;
            /* grid-row-start: 2; */
          }

          /* If the above is true we also need to shift the items in the header grid because we changed the column count */

          header:has(span.retoot-icon) > span.tooter {
            background: gray;
            grid-column-start: 2;
          }
          /* Do not need to shift the icon because it is in the first cell allways */

          section {
            background: red;
          }

          footer {
            background: blue;
          }
        }

        /*TODO Find solution for when subgrid is not supported */
        /* Subgrid helps keepint header content semantically in the header but still applying the grid layout
         Only supported in Firefox and Chrome Canary on Windows, at the time of writing */
        @supports (grid-template: subgrid / subgrid) {
          article {
            display: grid;
            /* grid-template-rows: 1fr 1fr auto 1fr; */
            grid-template-columns: auto 1fr 1fr;
            grid-template-areas:
              "header header header"
              "header header header"
              "aside content content"
              "aside footer footer";
          }

          header {
            display: grid;
            grid-area: header;
            background: blue;
            grid-template: subgrid / subgrid;
          }

          span.tooter {
            grid-area: 2 / 2;
            background: hotpink;
          }

          span.retooter {
            grid-area: 1 / 2;
          }

          time {
            grid-area: 3 / 3;
          }

          section {
            grid-column-start: span 2;
          }
          /* grid-area: <left> / <top> / <right> / <bottom>; */
          aside {
            grid-area: 2 / aside-start / footer-end / aside-end;

            background: red;
          }

          footer {
            background: green;
            grid-area: footer-start / footer-start / footer-end / footer-end;
          }
        }

        /* The account avatar */
        img {
          width: var(--avatar-width);
          border-radius: var(--radius-round);
        }
      </style>
      <article
        @click=${() => console.debug(this.querySelectorAll(".retoot-icon"))}
      >
        <header>
          ${isRetoot
            ? html` <span class="retoot-icon">🔁</span>
                <span class="retooter">${status.account.display_name}</span>`
            : nothing}

          <span class="tooter"
            >${isRetoot
              ? status.reblog!.account.display_name
              : status.account.display_name}</span
          >
          <time datetime="${createdAt}"
            >${new Date(createdAt).toLocaleString()}</time
          >
        </header>
        <aside>
          ${accountAvatar(isRetoot ? status.reblog!.account : status.account)}
        </aside>
        <section>
          ${unsafeHTML(isRetoot ? status.reblog?.content : status.content)}
        </section>
        <footer>Reactions</footer>
      </article>
    `;
  }
}
