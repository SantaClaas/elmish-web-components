import { TemplateResult, html, nothing } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import Status from "../api/status";
import { accountAvatar } from "./avatar";
import { mediaAttachments } from "./mediaAttachment";
import ProgramComponent from "../../../src/elmishComponent";
import { type Command, type Dispatch } from "../../../src/elmish/command";
import command from "../../../src/elmish/command";
import {
  NewSubscription,
  StopFunction,
  Subscription,
} from "../../../src/elmish/subscription";
import { css } from "../styling";

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

type StatusCardMessage = {
  type: "set status";
  status: Status;
};
type PropertySubscription = {
  propertyName: string;
  subscriptionId: string;
};
const subscription: PropertySubscription = {
  propertyName: "status",
  subscriptionId: "property changed",
};

const propertySubscriptions = new Map<
  PropertySubscription,
  Dispatch<StatusCardMessage>
>();

export class StatusCard extends ProgramComponent<
  Status | null,
  StatusCardMessage
> {
  protected static styles?: Promise<CSSStyleSheet> = css`
    article {
      border-radius: var(--radius-3);
      border: var(--border-size-2) solid var(--surface-3);
      box-shadow: var(--shadow-1);
      overflow: hidden;
      padding: var(--size-4);
      background: var(--surface-2);
    }

    img {
      width: var(--size-10);
      border-radius: var(--radius-round);
    }

    video {
      width: 100%;
      border-radius: var(--radius-2);
    }
  `;
  constructor() {
    super();
    console.debug("Constructed");
  }
  // Subscription based approach

  // Set up program loop before connected callback

  protected override subscribe(
    model: Status | null
  ): NewSubscription<StatusCardMessage>[] {
    const startSubscription = (
      dispatch: Dispatch<StatusCardMessage>
    ): StopFunction => {
      console.debug("Started subscription");

      // Maybe set a function here to a property and remove it when subscription is stopped
      propertySubscriptions.set(subscription, dispatch);
      return () => {
        propertySubscriptions.delete(subscription);
      };
    };
    console.debug("Subscribing", subscription);
    const statusChangeSubscription: NewSubscription<StatusCardMessage> = {
      id: [subscription.subscriptionId],
      start: startSubscription,
    };

    return [statusChangeSubscription];
  }

  // Since Elmish Web Components are a weird mix of object oriented and functional design we need to hook this up
  // Setter based approach to state change through property

  set status(status: Status) {
    // Dispatch message that status changed
    const dispatch = propertySubscriptions.get(subscription);
    console.debug("Set status", { dispatch, status });
    dispatch?.({ type: "set status", status });
  }

  protected override update(
    message: StatusCardMessage,
    model: Status | null
  ): [Status | null, Command<StatusCardMessage>] {
    console.debug("Received message");
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
    console.debug("View", { status });
    if (status === null) {
      return html`<p>No Status</p>`;
    }

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
}
