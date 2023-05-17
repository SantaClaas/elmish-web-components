import { RangeChangedEvent } from "@lit-labs/virtualizer";
import { TemplateResult, html } from "lit-html";
import Status from "../api/models/status";
import command, { Command, Dispatch } from "../../../src/elmish/command";
import PaginationUrls from "../api/paginationUrls";
import api from "../api/api";
import { AccessToken } from "../api/models/string";
import GetHomeTimelineResponse from "../api/models/getHomeTimelineResponse";

export type HomeTimelinePageModel = {
  readonly isLoadingMoreToots: boolean;
  readonly toots: Status[];
  readonly links: PaginationUrls;
  readonly accessToken: AccessToken;
};
export type HomeTimelinePageMessage =
  | {
      type: "sign out";
    }
  // This occurs when the range of stati rendered to the dom is changed by the lit virtualizer. If we reach the end of
  // the toots loaded, then we need to trigger loading more
  | { type: "virtualizer range changed"; event: RangeChangedEvent }
  | { type: "append toots"; response: GetHomeTimelineResponse };

function initialize() {}

function update(
  message: HomeTimelinePageMessage,
  model: HomeTimelinePageModel
): [HomeTimelinePageModel, Command<HomeTimelinePageMessage>] {
  switch (message.type) {
    case "sign out":
      return [model, command.none];

    case "virtualizer range changed":
      if (model.isLoadingMoreToots) {
        // Already loading more toots don't need to start another one
        return [model, command.none];
      }

      // Load more toots only when last toot has benn rendered
      if (message.event.last !== model.toots.length - 1) {
        return [model, command.none];
      }

      //TODO error handling
      const fetchNextTootsCommand = command.ofPromise.perform(
        () => api.fetchTootsFromUrl(model.links.next, model.accessToken),
        undefined,
        (response): HomeTimelinePageMessage => ({
          type: "append toots",
          response: response,
        })
      );

      return [{ ...model, isLoadingMoreToots: true }, fetchNextTootsCommand];
    case "append toots":
      return [
        {
          ...model,
          isLoadingMoreToots: false,
          links: message.response.links,
          // I tried push but lit virtualizer does not seem to update if it is the same array
          toots: [...model.toots, ...message.response.toots],
        },
        command.none,
      ];
  }
}
function view(
  model: HomeTimelinePageModel,
  dispatch: Dispatch<HomeTimelinePageMessage>
): TemplateResult {
  return html` <header>
    <h1>Home Timeline</h1>
    <button @click=${() => dispatch({ type: "sign out" })}>Sign out</button>
    <header>
      <ul>
        <lit-virtualizer
          @rangeChanged=${(event: RangeChangedEvent) =>
            dispatch({ type: "virtualizer range changed", event })}
          .items=${model.toots}
          .renderItem=${(status: Status) =>
            html`<dim-ice-status-card .status=${status}></dim-ice-status-card>`}
        >
        </lit-virtualizer>
      </ul>
    </header>
  </header>`;
}

const homeTimelinePage = {
  update,
  view,
};

export default homeTimelinePage;
