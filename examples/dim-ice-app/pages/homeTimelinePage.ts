import { RangeChangedEvent } from "@lit-labs/virtualizer";
import { TemplateResult, html } from "lit-html";
import Status from "../api/models/status";
import command, { Command, Dispatch } from "../../../src/elmish/command";
import PaginationUrls from "../api/paginationUrls";
import api from "../api/api";
import { AuthorizationState } from "../authorizationState";

export type HomeTimelinePageModel = (
  | { readonly type: "waiting for authorization" }
  | { readonly type: "loading" }
  | {
      readonly type: "loaded";
      readonly isLoadingMoreToots: boolean;
      readonly toots: Status[];
      readonly links: PaginationUrls;
    }
) & { authorizationState: AuthorizationState };

export type HomeTimelinePageMessage =
  | { type: "set toots"; toots: Status[]; links: PaginationUrls }
  // For when the authorization changes due to authorization running in the background or the user signing out
  | {
      type: "update authorization state";
      authorizationState: AuthorizationState;
    }
  | {
      type: "sign out";
    }
  // This occurs when the range of stati rendered to the dom is changed by the lit virtualizer. If we reach the end of
  // the toots loaded, then we need to trigger loading more
  | { type: "virtualizer range changed"; event: RangeChangedEvent };

export type HomeTimelinePageExternalMessage =
  | "sign out"
  | "leave page, no authorization";

function handleNewAuthorizationState(
  newAuthorizationState: AuthorizationState
): [
  HomeTimelinePageModel,
  Command<HomeTimelinePageMessage>,
  HomeTimelinePageExternalMessage?
] {
  if (newAuthorizationState.type === "authorized") {
    //TODO error handling
    const fetchTimelineCommand = command.ofPromise.perform(
      () =>
        api.getHomeTimeline(
          newAuthorizationState.instance.baseUrl,
          newAuthorizationState.accessToken
        ),
      undefined,
      ({ toots, links }): HomeTimelinePageMessage => ({
        type: "set toots",
        toots,
        links,
      })
    );
    return [
      { type: "loading", authorizationState: newAuthorizationState },
      fetchTimelineCommand,
    ];
  }

  if (newAuthorizationState.type === "authorization required") {
    return [
      {
        type: "waiting for authorization",
        authorizationState: newAuthorizationState,
      },
      command.none,
      "leave page, no authorization",
    ];
  }

  return [
    {
      type: "waiting for authorization",
      authorizationState: newAuthorizationState,
    },
    command.none,
  ];
}

function initialize(
  authorizationState: AuthorizationState
): [
  HomeTimelinePageModel,
  Command<HomeTimelinePageMessage>,
  HomeTimelinePageExternalMessage?
] {
  return handleNewAuthorizationState(authorizationState);
}

function update(
  message: HomeTimelinePageMessage,
  model: HomeTimelinePageModel
): [
  HomeTimelinePageModel,
  Command<HomeTimelinePageMessage>,
  HomeTimelinePageExternalMessage?
] {
  switch (message.type) {
    case "sign out":
      return [model, command.none, "sign out"];

    case "update authorization state":
      return handleNewAuthorizationState(message.authorizationState);
    // This currently handles the two cases of first load and additional toot loads
    case "set toots":
      if (
        model.type === "loading" ||
        model.type === "waiting for authorization"
      )
        return [
          {
            type: "loaded",
            isLoadingMoreToots: false,
            links: message.links,
            toots: message.toots,
            authorizationState: model.authorizationState,
          },
          command.none,
        ];

      // I tried push, but lit virtualizer does not seem to update if it is the same array
      const newToots = [...model.toots, ...message.toots];

      return [
        {
          ...model,
          toots: newToots,
          isLoadingMoreToots: false,
        },
        command.none,
      ];

    case "virtualizer range changed":
      if (model.type !== "loaded") {
        console.error("Expected to be loaded");
        return [model, command.none];
      }

      if (model.isLoadingMoreToots) {
        // Already loading more toots don't need to start another one
        return [model, command.none];
      }

      // Load more toots only when last toot has benn rendered
      if (message.event.last !== model.toots.length - 1) {
        return [model, command.none];
      }

      if (model.authorizationState.type !== "authorized") {
        console.error("Can not load more toots while being unauthorized");
        return [model, command.none];
      }

      const token = model.authorizationState.accessToken;
      //TODO error handling
      const fetchNextTootsCommand = command.ofPromise.perform(
        () => api.fetchTootsFromUrl(model.links.next, token),
        undefined,
        ({ links, toots }): HomeTimelinePageMessage => ({
          type: "set toots",
          links,
          toots,
        })
      );

      return [{ ...model, isLoadingMoreToots: true }, fetchNextTootsCommand];
  }
}

function view(
  model: HomeTimelinePageModel,
  dispatch: Dispatch<HomeTimelinePageMessage>
): TemplateResult {
  switch (model.type) {
    case "waiting for authorization":
      return html`Authorizing`;
    case "loading":
      return html`Loading toots...`;
    case "loaded":
      return html` <header>
          <h1>Home Timeline</h1>
          <button @click=${() => dispatch({ type: "sign out" })}>
            Sign out
          </button>
        </header>
        <ul>
          <lit-virtualizer
            @rangeChanged=${(event: RangeChangedEvent) =>
              dispatch({ type: "virtualizer range changed", event })}
            .items=${model.toots}
            .renderItem=${(status: Status) =>
              html`<dim-ice-status-card
                .status=${status}
              ></dim-ice-status-card>`}
          >
          </lit-virtualizer>
        </ul>`;
  }
}

const homeTimelinePage = {
  initialize,
  update,
  view,
};

export default homeTimelinePage;
