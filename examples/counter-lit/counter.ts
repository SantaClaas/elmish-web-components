// A typical counter component implementation to try implementing elmish

import { Command, Dispatch } from "../../src/framework/elmish/command";
import { TemplateResult, html, render } from "lit-html";

// Could also just say model is an alias for type number but this is clearer IMO
type CounterModel = {
  readonly count: number;
};

type CounterMessage = "Increase" | "Decrease";

export default class ElmishCounter extends HTMLElement {
  // ⏬ Elmish ⏬
  initialize(): [CounterModel, Command<CounterMessage>] {
    return [{ count: 0 }, []];
  }

  update(
    message: CounterMessage,
    model: CounterModel
  ): [CounterModel, Command<CounterMessage>] {
    switch (message) {
      case "Increase":
        return [{ count: model.count + 1 }, []];
      case "Decrease":
        return [{ count: model.count - 1 }, []];
    }
  }

  view(
    model: CounterModel,
    dispatch: Dispatch<CounterMessage>
  ): TemplateResult {
    return html`<article>
      <span>${model.count}</span>
      <button @click="${() => dispatch("Increase")}">Inrease</button>
      <button @click="${() => dispatch("Decrease")}">Decrease</button>
    </article>`;
  }

  // ⏬ Component lifecycle callbacks ⏬
  connectedCallback() {
    console.debug("Connected");
    // Run initialization and view?
    const shadowRoot = this.attachShadow({ mode: "open" });
    let [model] = this.initialize();
    const dispatch: Dispatch<CounterMessage> = (message: CounterMessage) => {
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

customElements.define("elmish-counter", ElmishCounter);
