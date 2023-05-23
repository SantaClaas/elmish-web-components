// The dim ice app mastodon client root component
import command from "../../src/elmish/command";
import { type Command, type Dispatch } from "../../src/elmish/command";
import { TemplateResult } from "lit-html";
import ElmishElement from "../../src/elmishComponent";
import { StatusCard } from "./components/statusCard";
import { css } from "./styling";
import MediaAttachmentCollection from "./components/mediaAttachment";
import "@lit-labs/virtualizer";
import homeTimelinePage, {
  HomeTimelinePageMessage,
  HomeTimelinePageModel,
} from "./pages/homeTimelinePage";
import welcomePage, {
  WelcomePageMessage,
  WelcomePageModel,
} from "./pages/welcomePage";
import Instance from "./instance";
import authorizationState, {
  AuthorizationState,
  AuthorizationStateMessage,
} from "./authorizationState";

type Page =
  | {
      page: "home timeline";
      model: HomeTimelinePageModel;
    }
  | { page: "welcome"; model: WelcomePageModel };
/**
 *  App model represents the different states the app can be in
 */
type AppModel = {
  activePage: Page;
  instance: Instance;
  authorizationState: AuthorizationState;
};

export type AppMessage =
  | {
      readonly type: "welcome page message";
      readonly message: WelcomePageMessage;
    }
  | {
      readonly type: "home timeline page message";
      readonly message: HomeTimelinePageMessage;
    }
  | {
      readonly type: "authorization state message";
      readonly message: AuthorizationStateMessage;
    };

function welcomePageMessage(message: WelcomePageMessage): AppMessage {
  return { type: "welcome page message", message };
}

function hometimelinePageMessage(message: HomeTimelinePageMessage): AppMessage {
  return { type: "home timeline page message", message };
}

function authorizationStateMessage(
  message: AuthorizationStateMessage
): AppMessage {
  return { type: "authorization state message", message };
}

class DimIceApp extends ElmishElement<AppModel, AppMessage> {
  initialize(): [AppModel, Command<AppMessage>] {
    const [authorizationStateModel, authorizationCommands] =
      authorizationState.initialize();

    const initialCommand: Command<AppMessage> = command.map(
      authorizationStateMessage,
      authorizationCommands
    );

    let pageModel, pageCommand;
    // Set start page to welcome page if we don't have app credentials to allow user to select instance. This is most
    // likely the first open
    if (authorizationStateModel.type === "no app credentials") {
      [pageModel, pageCommand] = welcomePage.initialize(
        authorizationStateModel.instance
      );
      initialCommand.push(...command.map(welcomePageMessage, pageCommand));
      return [
        {
          activePage: { page: "welcome", model: pageModel },
          instance: pageModel.instance,
          authorizationState: authorizationStateModel,
        },
        initialCommand,
      ];
    }

    [pageModel, pageCommand] = homeTimelinePage.initialize(
      authorizationStateModel
    );

    initialCommand.push(...command.map(hometimelinePageMessage, pageCommand));

    return [
      {
        activePage: { page: "home timeline", model: pageModel },
        authorizationState: authorizationStateModel,
        instance: authorizationStateModel.instance,
      },
      initialCommand,
    ];
  }

  update(
    message: AppMessage,
    model: AppModel
  ): [AppModel, Command<AppMessage>] {
    switch (message.type) {
      case "welcome page message":
        if (model.activePage.page !== "welcome") {
          console.error("Expected to be on welcome page");
          return [model, command.none];
        }

        const [welcomePageModel, welcomePageCommand, externalMessage] =
          welcomePage.update(message.message, model.activePage.model);

        const newCommands: Command<AppMessage> = command.map(
          welcomePageMessage,
          welcomePageCommand
        );

        switch (externalMessage?.type) {
          case undefined:
            return [
              {
                instance: model.instance,
                activePage: {
                  page: "welcome",
                  model: welcomePageModel,
                },
                authorizationState: model.authorizationState,
              },
              newCommands,
            ];
          case "instance submitted": {
            const [newAuthorizationState, newAuthorizationStateCommand] =
              authorizationState.update(
                { type: "set instance", instance: externalMessage.instance },
                model.authorizationState
              );

            newCommands.push(
              ...command.map(
                authorizationStateMessage,
                newAuthorizationStateCommand
              )
            );

            const [pageModel, pageCommand] = homeTimelinePage.initialize(
              newAuthorizationState
            );

            newCommands.push(
              ...command.map(hometimelinePageMessage, pageCommand)
            );

            return [
              // After instance was submitted, we show the home page. The authorization flow runs in the background
              {
                activePage: { page: "home timeline", model: pageModel },
                authorizationState: newAuthorizationState,
                instance: newAuthorizationState.instance,
              },
              newCommands,
            ];
          }
        }
      case "authorization state message": {
        const [
          newAuthorizationState,
          newAuthorizationStateCommand,
          externalMessage,
        ] = authorizationState.update(
          message.message,
          model.authorizationState
        );

        const newCommands = command.map(
          authorizationStateMessage,
          newAuthorizationStateCommand
        );

        if (externalMessage === undefined)
          return [
            { ...model, authorizationState: newAuthorizationState },
            newCommands,
          ];

        // if(externalMessage.type === "authorization completed")
        if (model.activePage.page === "home timeline") {
          const [homeTimelineModel, homeTimelineCommand] =
            homeTimelinePage.update(
              {
                type: "update authorization state",
                authorizationState: newAuthorizationState,
              },
              model.activePage.model
            );

          newCommands.push(
            ...command.map(hometimelinePageMessage, homeTimelineCommand)
          );

          return [
            {
              activePage: { page: "home timeline", model: homeTimelineModel },
              instance: model.instance,
              authorizationState: newAuthorizationState,
            },
            newCommands,
          ];
        }

        const [pageModel, pageCommand] = homeTimelinePage.initialize(
          newAuthorizationState
        );

        newCommands.push(...command.map(hometimelinePageMessage, pageCommand));

        return [
          // After instance was submitted, we show the home page. The authorization flow runs in the background
          {
            activePage: { page: "home timeline", model: pageModel },
            authorizationState: newAuthorizationState,
            instance: newAuthorizationState.instance,
          },
          newCommands,
        ];
      }
      case "home timeline page message":
        if (model.activePage.page !== "home timeline") {
          console.error("Expected to be on home timeline page");
          return [model, command.none];
        }

        const [homePageModel, homePageCommand] = homeTimelinePage.update(
          message.message,
          model.activePage.model
        );

        const mappedCommand = command.map(
          hometimelinePageMessage,
          homePageCommand
        );
        return [
          {
            activePage: { page: "home timeline", model: homePageModel },
            instance: model.instance,
            authorizationState: model.authorizationState,
          },
          mappedCommand,
        ];
    }
  }

  static styles = css`
    /* Additional normalization */
    ul {
      padding-inline-start: 0;
      max-width: var(--size-15);
      margin-inline: auto;
    }

    ul lit-virtualizer > * + * {
      border-top: var(--border-size-2) solid var(--surface-2);
    }

    /* Start of styling */

    :host {
      /* Default display does not seem to be block and causes content to overflow and display normally.
         But padding and other styles only apply to a small rectangle
       */
      display: block;
    }

    h1 {
      padding-inline-start: var(--size-2);
    }
  `;

  view(model: AppModel, dispatch: Dispatch<AppMessage>): TemplateResult {
    // Thanks to union support in TypeScript the compiler can detect that these are the only valid cases and that we don't need to handle default
    switch (model.activePage.page) {
      case "welcome":
        return welcomePage.view(model.activePage.model, (message) =>
          dispatch(welcomePageMessage(message))
        );
      case "home timeline":
        return homeTimelinePage.view(model.activePage.model, (message) =>
          dispatch(hometimelinePageMessage(message))
        );
    }
  }
}

customElements.define(
  "dim-ice-media-attachments-collection",
  MediaAttachmentCollection
);
customElements.define("dim-ice-status-card", StatusCard);
customElements.define("dim-ice-app", DimIceApp);
