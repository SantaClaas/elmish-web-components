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
};

export type AppMessage =
  | {
      readonly type: "welcome page message";
      readonly message: WelcomePageMessage;
    }
  | {
      readonly type: "home timeline page message";
      readonly message: HomeTimelinePageMessage;
    };

function welcomePageMessage(message: WelcomePageMessage): AppMessage {
  return { type: "welcome page message", message };
}

function hometimelinePageMessage(message: HomeTimelinePageMessage): AppMessage {
  return { type: "home timeline page message", message };
}

class DimIceApp extends ElmishElement<AppModel, AppMessage> {
  initialize(): [AppModel, Command<AppMessage>] {
    // We delegate all of the authorization flow to the welcome page
    // Therefore we need to always start there
    const [pageModel, pageCommand] = welcomePage.initialize();

    const initialCommand: Command<AppMessage> = command.map(
      welcomePageMessage,
      pageCommand
    );

    return [
      {
        activePage: { page: "welcome", model: pageModel },
        instance: pageModel.instance,
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
              },
              newCommands,
            ];
          case "authorization completed":
            const [newPageModel, newPageCommands] = homeTimelinePage.initialize(
              externalMessage.accessToken,
              externalMessage.instance
            );

            newCommands.push(
              ...command.map(hometimelinePageMessage, newPageCommands)
            );
            return [
              {
                instance: externalMessage.instance,
                activePage: { page: "home timeline", model: newPageModel },
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
