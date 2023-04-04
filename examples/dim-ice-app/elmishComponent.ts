// The first attempt at an elmish base component

import { TemplateResult, render } from "lit-html";
import { Command, Dispatch } from "../../src/elmish/command";

// Not exactly elmish but more like lit-elmish as this relies on lit-html to render the view
export default abstract class ElmishComponent<
  TModel,
  TMessage
> extends HTMLElement {
  // ⏬ Elmish ⏬
  abstract initialize(): [TModel, Command<TMessage>];

  abstract update(
    message: TMessage,
    model: TModel
  ): [TModel, Command<TMessage>];

  abstract view(model: TModel, dispatch: Dispatch<TMessage>): TemplateResult;

  // ⏬ Component lifecycle callbacks ⏬
  connectedCallback() {
    console.debug("Connected");
    // Run initialization and view?
    const shadowRoot = this.attachShadow({ mode: "open" });
    let [model] = this.initialize();
    const dispatch: Dispatch<TMessage> = (message: TMessage) => {
      const [newModel] = this.update(message, model);
      console.debug("Dispatch", { message, newModel, oldModel: model });
      model = newModel;
      const newView = this.view(model, dispatch);
      render(newView, shadowRoot);
    };

    const view = this.view(model, dispatch);

    render(view, shadowRoot);
  }

  disconnectedCallback() {
    console.debug("Disconected");
    // Stop subscriptions?
    // Clean up?
  }

  adoptedCallback() {
    console.debug("Adopted");
    // Reset model?
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string
  ) {
    console.debug("Attribute changed", { name, oldValue, newValue });
    // Run attribute changed subscriptions that listen to the attribute?
  }

  static get observedAttributes() {
    console.debug("Get observed attributes");
    // Get subscriptions to attribute changes and the names of their attributes to return them here
    return ["value"];
  }
}
